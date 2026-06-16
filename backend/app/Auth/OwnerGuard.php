<?php

namespace App\Auth;

use App\Models\Owner;
use App\Models\OwnerAuthToken;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

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
        $rawToken = $request->cookie('oda_owner_token');
        if (!$rawToken && $request->bearerToken()) {
            $rawToken = $request->bearerToken();
        }
        if (!$rawToken) {
            return null;
        }

        $tokenHash = hash('sha256', $rawToken);
        $token = OwnerAuthToken::where('token_hash', $tokenHash)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$token) {
            return null;
        }

        $owner = Owner::find($token->owner_id);
        if (!$owner) {
            return null;
        }

        $token->update(['last_used_at' => now()]);

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
