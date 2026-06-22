<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Owner;
use App\Models\OwnerAuthToken;
use App\Models\Restaurant;
use Firebase\JWT\JWT;
use Tests\TestCase;

class AdminTest extends TestCase
{
    private Owner $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Owner::create([
            'phone_number' => '+admin123456',
            'phone_verified_at' => now(),
            'is_admin' => true,
        ]);
    }

    private function adminCookie(): array
    {
        $jti = 'test-jti-' . uniqid();
        $jwt = JWT::encode([
            'sub' => $this->admin->id,
            'phone' => $this->admin->phone_number,
            'admin' => true,
            'multi' => false,
            'jti' => $jti,
            'iat' => now()->timestamp,
            'exp' => now()->addDays(30)->timestamp,
        ], config('jwt.secret'), config('jwt.algo'));

        OwnerAuthToken::create([
            'owner_id' => $this->admin->id,
            'token_hash' => $jti,
            'expires_at' => now()->addDays(30),
        ]);

        return ['Authorization' => 'Bearer ' . $jwt];
    }

    public function test_admin_list_restaurants(): void
    {
        Restaurant::create([
            'id' => 'restaurant-admin-1',
            'name' => 'Admin Test 1',
            'public_slug' => 'admin-test-1',
            'active' => true,
        ]);

        Restaurant::create([
            'id' => 'restaurant-admin-2',
            'name' => 'Admin Test 2',
            'public_slug' => 'admin-test-2',
            'active' => false,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->admin->id,
            'restaurant_id' => 'restaurant-admin-1',
        ]);

        $response = $this->withHeaders($this->adminCookie())
            ->getJson('/api/admin/restaurants');

        $response->assertOk();
        $response->assertJsonCount(2);
    }

    public function test_admin_menu_template(): void
    {
        $restaurant = Restaurant::create([
            'id' => 'restaurant-template',
            'name' => 'Template Test',
            'public_slug' => 'template-test',
            'active' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Template Item',
            'price' => 10,
            'category' => 'Main',
            'active' => true,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->admin->id,
            'restaurant_id' => $restaurant->id,
        ]);

        $response = $this->withHeaders($this->adminCookie())
            ->getJson("/api/admin/restaurants/{$restaurant->id}/menu-template");

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Template Item']);
    }

    public function test_admin_requires_admin_role(): void
    {
        $regular = Owner::create(['phone_number' => '+regular123', 'phone_verified_at' => now(), 'is_admin' => false]);
        $jti = 'test-jti-regular';
        $jwt = JWT::encode([
            'sub' => $regular->id,
            'phone' => $regular->phone_number,
            'admin' => false,
            'multi' => false,
            'jti' => $jti,
            'iat' => now()->timestamp,
            'exp' => now()->addDays(30)->timestamp,
        ], config('jwt.secret'), config('jwt.algo'));

        OwnerAuthToken::create([
            'owner_id' => $regular->id,
            'token_hash' => $jti,
            'expires_at' => now()->addDays(30),
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $jwt])
            ->getJson('/api/admin/restaurants');

        $response->assertStatus(403);
    }
}
