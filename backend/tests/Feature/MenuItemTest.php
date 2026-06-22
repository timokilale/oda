<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Owner;
use App\Models\OwnerAuthToken;
use App\Models\Restaurant;
use Firebase\JWT\JWT;
use Tests\TestCase;

class MenuItemTest extends TestCase
{
    private Owner $owner;
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
        $this->restaurant = Restaurant::create([
            'id' => 'restaurant-menu-test',
            'name' => 'Menu Test',
            'public_slug' => 'menu-test',
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

    public function test_list_menu_items_empty(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/menu-items");

        $response->assertOk();
        $response->assertJson(['items' => [], 'categorySuggestions' => []]);
    }

    public function test_create_menu_item(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/menu-items", [
                'name' => 'Burger',
                'price' => 12.50,
                'category' => 'Main dishes',
                'description' => 'Tasty burger',
            ]);

        $response->assertCreated();
        $response->assertJsonFragment(['name' => 'Burger']);

        $this->assertDatabaseHas('menu_items', ['name' => 'Burger']);
    }

    public function test_create_menu_item_invalid_price(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/menu-items", [
                'name' => 'Burger',
                'price' => -10,
                'category' => 'Main dishes',
            ]);

        $response->assertStatus(422);
    }

    public function test_create_menu_item_missing_fields(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->postJson("/api/restaurants/{$this->restaurant->id}/menu-items", []);

        $response->assertStatus(422);
    }

    public function test_update_menu_item(): void
    {
        $item = MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Old Name',
            'price' => 10,
            'category' => 'Main dishes',
            'active' => true,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->patchJson("/api/restaurants/{$this->restaurant->id}/menu-items/{$item->id}", [
                'name' => 'Updated Name',
                'price' => 15.99,
            ]);

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Updated Name']);
    }

    public function test_delete_menu_item_no_references(): void
    {
        $item = MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'To Delete',
            'price' => 5,
            'category' => 'Drinks',
            'active' => true,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->deleteJson("/api/restaurants/{$this->restaurant->id}/menu-items/{$item->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
    }

    public function test_delete_menu_item_with_references_soft_deletes(): void
    {
        $item = MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Referenced',
            'price' => 5,
            'category' => 'Drinks',
            'active' => true,
        ]);

        $orderId = \Illuminate\Support\Facades\DB::table('orders')->insertGetId([
            'restaurant_id' => $this->restaurant->id,
            'status' => 'pending',
        ]);

        \Illuminate\Support\Facades\DB::table('order_items')->insert([
            'order_id' => $orderId,
            'menu_item_id' => $item->id,
            'quantity' => 1,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->deleteJson("/api/restaurants/{$this->restaurant->id}/menu-items/{$item->id}");

        $response->assertStatus(204);
        $this->assertDatabaseHas('menu_items', ['id' => $item->id, 'active' => 0]);
    }

    public function test_category_suggestions(): void
    {
        MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Pasta',
            'price' => 15,
            'category' => 'Main dishes',
            'active' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Cola',
            'price' => 3,
            'category' => 'Drinks',
            'active' => true,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/menu-items");

        $response->assertOk();
        $response->assertJsonCount(2, 'items');
        $this->assertContains('Main dishes', $response->json('categorySuggestions'));
        $this->assertContains('Drinks', $response->json('categorySuggestions'));
    }
}
