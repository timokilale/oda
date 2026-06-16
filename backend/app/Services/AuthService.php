<?php

namespace App\Services;

use App\Models\Owner;
use App\Models\OwnerAuthOtp;
use App\Models\OwnerAuthToken;
use App\Models\PendingOwnerRegistration;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthService
{
    public function normalizePhoneNumber(?string $value): string
    {
        $digits = preg_replace('/[^\d]/', '', $value ?? '');
        if (strlen($digits) < 10 || strlen($digits) > 15) {
            return '';
        }
        return '+' . $digits;
    }

    public function isValidPhoneNumber(string $phoneNumber): bool
    {
        return (bool) preg_match('/^\+\d{10,15}$/', $phoneNumber);
    }

    public function normalizeImagePosition(?string $value): float
    {
        $num = (float) $value;
        if (!is_finite($num)) return 50;
        return max(0, min(100, round($num, 2)));
    }

    private function hashOtpCode(string $phoneNumber, string $purpose, string $otpCode): string
    {
        return hash_hmac('sha256', "{$phoneNumber}:{$purpose}:{$otpCode}", config('app.key'));
    }

    private function generateOtpCode(int $length = 6): string
    {
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= random_int(0, 9);
        }
        return $code;
    }

    private function hashAuthToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function generateAuthToken(): string
    {
        return Str::random(64);
    }

    public function buildUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $candidate = $slug;
        $suffix = 2;

        while (Restaurant::where('public_slug', $candidate)->exists()) {
            $candidate = $slug . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }

    public function handleRegisterOtp(Request $request): array
    {
        $phoneNumber = $this->normalizePhoneNumber($request->input('phoneNumber'));
        $restaurantName = trim($request->input('restaurantName', ''));
        $city = trim($request->input('city', ''));
        $country = trim($request->input('country', ''));
        $imagePositionX = $this->normalizeImagePosition($request->input('restaurantImagePositionX'));
        $imagePositionY = $this->normalizeImagePosition($request->input('restaurantImagePositionY'));

        $imagePath = null;
        if ($request->hasFile('restaurantImage')) {
            $file = $request->file('restaurantImage');
            $path = $file->store('restaurants', 'uploads');
            $imagePath = '/uploads/' . $path;
        }

        if (!$this->isValidPhoneNumber($phoneNumber) || !$restaurantName) {
            abort(400, 'A valid phone number and restaurant name are required.');
        }

        if (Owner::where('phone_number', $phoneNumber)->exists()) {
            abort(409, 'An account with this phone number already exists.');
        }

        $existing = PendingOwnerRegistration::find($phoneNumber);
        $existingImagePath = $existing->image_path ?? null;
        $resolvedImagePath = $imagePath ?? $existingImagePath;

        PendingOwnerRegistration::updateOrCreate(
            ['phone_number' => $phoneNumber],
            [
                'restaurant_name' => $restaurantName,
                'city' => $city,
                'country' => $country,
                'image_path' => $resolvedImagePath,
                'image_position_x' => $imagePositionX,
                'image_position_y' => $imagePositionY,
            ]
        );

        $otpCode = $this->generateOtpCode();
        $expiresAt = now()->addMinutes(10);

        OwnerAuthOtp::where('phone_number', $phoneNumber)
            ->where('purpose', 'register')
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        OwnerAuthOtp::create([
            'phone_number' => $phoneNumber,
            'purpose' => 'register',
            'request_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'code_hash' => $this->hashOtpCode($phoneNumber, 'register', $otpCode),
            'expires_at' => $expiresAt,
        ]);

        return [
            'otpCode' => $otpCode,
            'phoneNumber' => $phoneNumber,
        ];
    }

    public function verifyRegisterOtp(string $phoneNumber, string $otpCode, ?string $userAgent): array
    {
        return DB::transaction(function () use ($phoneNumber, $otpCode, $userAgent) {
            $this->consumeOtp($phoneNumber, 'register', $otpCode);

            $pending = PendingOwnerRegistration::where('phone_number', $phoneNumber)->lockForUpdate()->first();
            if (!$pending) {
                abort(400, 'Registration request expired. Send a new OTP.');
            }

            if (Owner::where('phone_number', $phoneNumber)->exists()) {
                abort(409, 'An account with this phone number already exists.');
            }

            $owner = Owner::create([
                'phone_number' => $phoneNumber,
                'phone_verified_at' => now(),
            ]);

            $slug = $this->buildUniqueSlug($pending->restaurant_name);

            $restaurant = Restaurant::create([
                'id' => 'restaurant-' . $owner->id,
                'name' => $pending->restaurant_name,
                'public_slug' => $slug,
                'city' => $pending->city,
                'country' => $pending->country,
                'image_path' => $pending->image_path,
                'image_position_x' => $pending->image_position_x,
                'image_position_y' => $pending->image_position_y,
                'active' => true,
            ]);

            DB::table('owner_restaurants')->insert([
                'owner_id' => $owner->id,
                'restaurant_id' => $restaurant->id,
            ]);

            $pending->delete();

            $token = $this->issueToken($owner->id, $userAgent);

            return [
                'owner' => $owner->fresh(),
                'token' => $token,
            ];
        });
    }

    public function handleLoginOtp(Request $request): array
    {
        $phoneNumber = $this->normalizePhoneNumber($request->input('phoneNumber'));

        if (!$this->isValidPhoneNumber($phoneNumber)) {
            abort(400, 'Enter a valid phone number.');
        }

        $owner = Owner::where('phone_number', $phoneNumber)->whereNotNull('phone_verified_at')->first();
        $otpCode = '';

        if ($owner) {
            $otpCode = $this->generateOtpCode();
            $expiresAt = now()->addMinutes(10);

            OwnerAuthOtp::where('phone_number', $phoneNumber)
                ->where('purpose', 'login')
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            OwnerAuthOtp::create([
                'phone_number' => $phoneNumber,
                'purpose' => 'login',
                'request_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'code_hash' => $this->hashOtpCode($phoneNumber, 'login', $otpCode),
                'expires_at' => $expiresAt,
            ]);
        }

        return [
            'owner' => $owner,
            'otpCode' => $otpCode,
        ];
    }

    public function verifyLoginOtp(string $phoneNumber, string $otpCode, ?string $userAgent): array
    {
        return DB::transaction(function () use ($phoneNumber, $otpCode, $userAgent) {
            $this->consumeOtp($phoneNumber, 'login', $otpCode);

            $owner = Owner::where('phone_number', $phoneNumber)->whereNotNull('phone_verified_at')->first();
            if (!$owner) {
                abort(401, 'This phone number is not registered.');
            }

            $token = $this->issueToken($owner->id, $userAgent);

            return [
                'owner' => $owner->fresh(),
                'token' => $token,
            ];
        });
    }

    public function revokeToken(?string $cookieValue): void
    {
        if (!$cookieValue) return;

        $tokenHash = $this->hashAuthToken($cookieValue);
        OwnerAuthToken::where('token_hash', $tokenHash)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    private function consumeOtp(string $phoneNumber, string $purpose, string $otpCode): void
    {
        $otp = OwnerAuthOtp::where('phone_number', $phoneNumber)
            ->where('purpose', $purpose)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        if (!$otp || $otp->consumed_at || $otp->expires_at <= now()) {
            if ($otp && !$otp->consumed_at) {
                $otp->update(['consumed_at' => now()]);
            }
            abort(400, 'OTP expired. Request a new code.');
        }

        if ($otp->attempt_count >= 5) {
            $otp->update(['consumed_at' => now()]);
            abort(400, 'Too many invalid OTP attempts. Request a new code.');
        }

        $expectedHash = $this->hashOtpCode($phoneNumber, $purpose, $otpCode);
        if (!hash_equals($expectedHash, $otp->code_hash)) {
            $otp->increment('attempt_count');
            if ($otp->fresh()->attempt_count >= 5) {
                $otp->update(['consumed_at' => now()]);
            }
            abort(400, 'Invalid OTP code.');
        }

        $otp->update(['consumed_at' => now()]);
    }

    private function issueToken(int $ownerId, ?string $userAgent): array
    {
        $rawToken = $this->generateAuthToken();
        $expiresAt = now()->addDays(30);

        OwnerAuthToken::create([
            'owner_id' => $ownerId,
            'token_hash' => $this->hashAuthToken($rawToken),
            'user_agent' => $userAgent ? substr($userAgent, 0, 255) : null,
            'expires_at' => $expiresAt,
        ]);

        return [
            'raw' => $rawToken,
            'expires_at' => $expiresAt,
        ];
    }

    public function setAuthCookie($response, string $rawToken, \DateTime $expiresAt): void
    {
        $response->withCookie(cookie()->make(
            'oda_owner_token', $rawToken,
            $expiresAt->getTimestamp() - time(),
            '/', null, config('app.env') === 'production', true, false, 'lax'
        ));
    }

    public function clearAuthCookie($response): void
    {
        $response->withCookie(cookie()->forget('oda_owner_token', '/'));
    }
}
