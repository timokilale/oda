<?php

namespace App\Auth;

use App\Models\Owner;
use App\Models\OwnerAuthToken;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;

class OwnerGuard implements Guard
{
    use GuardHelpers;

    private ?Owner $resolvedOwner = null;
    private ?OwnerAuthToken $resolvedToken = null;

    public function __construct() {}

    public function user(): ?Authenticatable
    {
        if ($this->resolvedOwner !== null) {
            return $this->resolvedOwner;
        }

        $request = app('request');
        $jwt = $request->cookie('oda_owner_token');
        if (!$jwt && $request->bearerToken()) {
            $jwt = $request->bearerToken();
        }
        if (!$jwt) {
            return null;
        }

        try {
            $decoded = JWT::decode($jwt, new Key(config('jwt.secret'), config('jwt.algo')));
        } catch (\Exception $e) {
            return null;
        }

        $token = OwnerAuthToken::where('token_hash', $decoded->jti)
            ->whereNull('revoked_at')
            ->first();

        if (!$token) {
            return null;
        }

        $owner = Owner::find($decoded->sub);
        if (!$owner) {
            return null;
        }

        $this->resolvedOwner = $owner;
        $this->resolvedToken = $token;

        return $owner;
    }

    public function id(): ?int
    {
        return $this->user()?->getAuthIdentifier();
    }

    public function check(): bool
    {
        return $this->user() !== null;
    }

    public function guest(): bool
    {
        return !$this->check();
    }

    public function setUser(Authenticatable $user): void
    {
        $this->resolvedOwner = $user;
    }

    public function hasUser(): bool
    {
        return $this->resolvedOwner !== null;
    }

    public function validate(array $credentials = []): bool
    {
        return false;
    }

    public function getToken(): ?OwnerAuthToken
    {
        $this->user();
        return $this->resolvedToken;
    }
}
