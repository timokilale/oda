<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\OwnerAuthToken;
use App\Models\Restaurant;
use Firebase\JWT\JWT;
use Tests\TestCase;

class TableTest extends TestCase
{
    private Owner $owner;
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
        $this->restaurant = Restaurant::create([
            'id' => 'restaurant-table-test',
            'name' => 'Table Test',
            'public_slug' => 'table-test',
            'active' => true,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->owner->id,
            'restaurant_id' => $this->restaurant->id,
        ]);
    }

    private function authCookie(): array
    {
        $jti = 'test-jti-' . uniqid();
        $jwt = JWT::encode([
            'sub' => $this->owner->id,
            'phone' => $this->owner->phone_number,
            'admin' => false,
            'multi' => false,
            'jti' => $jti,
            'iat' => now()->timestamp,
            'exp' => now()->addDays(30)->timestamp,
        ], config('jwt.secret'), config('jwt.algo'));

        OwnerAuthToken::create([
            'owner_id' => $this->owner->id,
            'token_hash' => $jti,
            'expires_at' => now()->addDays(30),
        ]);

        return ['Authorization' => 'Bearer ' . $jwt];
    }

    public function test_list_tables_empty(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/tables");

        $response->assertOk();
        $response->assertJson(['tables' => []]);
    }

    public function test_create_table(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/tables", [
                'tableNumber' => 'A1',
            ]);

        $response->assertCreated();
        $response->assertJsonFragment(['tableNumber' => 'A1']);

        $this->assertDatabaseHas('restaurant_tables', [
            'restaurant_id' => $this->restaurant->id,
            'table_number' => 'A1',
        ]);
    }

    public function test_create_duplicate_table(): void
    {
        $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/tables", [
                'tableNumber' => 'A1',
            ]);

        $response = $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/tables", [
                'tableNumber' => 'A1',
            ]);

        $response->assertStatus(409);
    }

    public function test_delete_table(): void
    {
        $createResponse = $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/tables", [
                'tableNumber' => 'B2',
            ]);

        $tableId = $createResponse->json('table.id');

        $response = $this->withHeaders($this->authCookie())
            ->deleteJson("/api/restaurants/{$this->restaurant->id}/tables/{$tableId}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('restaurant_tables', ['id' => $tableId]);
    }

    public function test_delete_table_not_found(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->deleteJson("/api/restaurants/{$this->restaurant->id}/tables/99999");

        $response->assertStatus(404);
    }
}
