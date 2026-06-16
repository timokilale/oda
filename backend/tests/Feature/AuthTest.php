<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\OwnerAuthOtp;
use App\Models\OwnerAuthToken;
use App\Models\PendingOwnerRegistration;
use App\Models\Restaurant;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_health_endpoint(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk();
        $response->assertJson(['status' => 'ok']);
    }

    public function test_register_otp_request(): void
    {
        $response = $this->postJson('/api/auth/register/request-otp', [
            'phoneNumber' => '+1234567890',
            'restaurantName' => 'Test Restaurant',
            'city' => 'Test City',
            'country' => 'Test Country',
        ]);

        $response->assertStatus(202);
        $response->assertJson(['message' => 'OTP generated for registration.']);

        $this->assertDatabaseHas('owner_auth_otps', [
            'phone_number' => '+1234567890',
            'purpose' => 'register',
        ]);

        $this->assertDatabaseHas('pending_owner_registrations', [
            'phone_number' => '+1234567890',
            'restaurant_name' => 'Test Restaurant',
        ]);
    }

    public function test_register_otp_duplicate_phone(): void
    {
        Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);

        $response = $this->postJson('/api/auth/register/request-otp', [
            'phoneNumber' => '+1234567890',
            'restaurantName' => 'Test',
        ]);

        $response->assertStatus(409);
    }

    public function test_register_missing_fields(): void
    {
        $response = $this->postJson('/api/auth/register/request-otp', [
            'phoneNumber' => '',
            'restaurantName' => '',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_verify_otp(): void
    {
        $this->withoutExceptionHandling();

        PendingOwnerRegistration::create([
            'phone_number' => '+1234567890',
            'restaurant_name' => 'Test Restaurant',
        ]);

        $otpCode = '123456';
        $codeHash = hash_hmac('sha256', '+1234567890:register:123456', config('app.key'));

        OwnerAuthOtp::create([
            'phone_number' => '+1234567890',
            'purpose' => 'register',
            'code_hash' => $codeHash,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/auth/register/verify-otp', [
            'phoneNumber' => '+1234567890',
            'otpCode' => $otpCode,
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['owner' => ['id', 'phoneNumber']]);

        $this->assertDatabaseHas('owners', ['phone_number' => '+1234567890']);
        $this->assertDatabaseHas('restaurants', ['name' => 'Test Restaurant']);

        $cookie = $response->headers->getCookies();
        $this->assertNotEmpty($cookie);
        $this->assertEquals('oda_owner_token', $cookie[0]->getName());
    }

    public function test_register_verify_otp_invalid_code(): void
    {
        OwnerAuthOtp::create([
            'phone_number' => '+1234567890',
            'purpose' => 'register',
            'code_hash' => hash_hmac('sha256', '+1234567890:register:wrong', config('app.key')),
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/auth/register/verify-otp', [
            'phoneNumber' => '+1234567890',
            'otpCode' => '000000',
        ]);

        $response->assertStatus(400);
    }

    public function test_login_otp_request(): void
    {
        Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);

        $response = $this->postJson('/api/auth/login/request-otp', [
            'phoneNumber' => '+1234567890',
        ]);

        $response->assertStatus(202);
        $response->assertJson(['message' => 'OTP generated for login.']);

        $this->assertDatabaseHas('owner_auth_otps', [
            'phone_number' => '+1234567890',
            'purpose' => 'login',
        ]);
    }

    public function test_login_verify_otp(): void
    {
        $owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);

        $otpCode = '123456';
        $codeHash = hash_hmac('sha256', '+1234567890:login:123456', config('app.key'));

        OwnerAuthOtp::create([
            'phone_number' => '+1234567890',
            'purpose' => 'login',
            'code_hash' => $codeHash,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/auth/login/verify-otp', [
            'phoneNumber' => '+1234567890',
            'otpCode' => $otpCode,
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['owner' => ['id']]);

        $cookie = $response->headers->getCookies();
        $this->assertNotEmpty($cookie);
    }

    public function test_login_unregistered_phone(): void
    {
        $response = $this->postJson('/api/auth/login/request-otp', [
            'phoneNumber' => '+9999999999',
        ]);

        $response->assertStatus(202);
        $response->assertJson([
            'message' => 'If the phone number is registered, an OTP has been generated.',
        ]);
    }

    public function test_me_endpoint(): void
    {
        $owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
        $token = hash('sha256', 'test-raw-token');

        OwnerAuthToken::create([
            'owner_id' => $owner->id,
            'token_hash' => $token,
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer test-raw-token'])
            ->getJson('/api/auth/me');

        $response->assertOk();
        $response->assertJson(['owner' => ['id' => $owner->id]]);
    }

    public function test_me_unauthenticated(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
    }

    public function test_logout(): void
    {
        $owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
        $token = hash('sha256', 'test-raw-token');

        OwnerAuthToken::create([
            'owner_id' => $owner->id,
            'token_hash' => $token,
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer test-raw-token'])
            ->postJson('/api/auth/logout');

        $response->assertStatus(204);

        $this->assertDatabaseHas('owner_auth_tokens', [
            'token_hash' => $token,
            'revoked_at' => now(),
        ]);
    }
}
