<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Owner;
use App\Models\OwnerAuthToken;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Firebase\JWT\JWT;
use Tests\TestCase;

class OrderTest extends TestCase
{
    private Owner $owner;
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
        $this->restaurant = Restaurant::create([
            'id' => 'restaurant-order-test',
            'name' => 'Order Test',
            'public_slug' => 'order-test',
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

    public function test_list_orders_empty(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/orders");

        $response->assertOk();
        $response->assertJson(['orders' => [], 'orderSummary' => [
            'totalOrderCount' => 0,
            'pendingOrderCount' => 0,
            'confirmedOrderCount' => 0,
            'completedOrderCount' => 0,
            'cancelledOrderCount' => 0,
        ]]);
    }

    public function test_list_orders(): void
    {
        $item = MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Pizza',
            'price' => 20,
            'category' => 'Main',
            'active' => true,
        ]);

        $order = Order::create([
            'restaurant_id' => $this->restaurant->id,
            'table_number' => '5',
            'status' => 'pending',
        ]);

        \Illuminate\Support\Facades\DB::table('order_items')->insert([
            'order_id' => $order->id,
            'menu_item_id' => $item->id,
            'quantity' => 2,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/orders");

        $response->assertOk();
        $response->assertJsonCount(1, 'orders');
        $response->assertJsonFragment(['tableNumber' => '5']);
        $response->assertJsonFragment(['totalAmount' => 40.0]);
        $response->assertJsonFragment(['itemsSummary' => '2x Pizza']);
    }

    public function test_update_order_status(): void
    {
        $order = Order::create([
            'restaurant_id' => $this->restaurant->id,
            'table_number' => '3',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->patchJson("/api/restaurants/{$this->restaurant->id}/orders/{$order->id}/status", [
                'status' => 'confirmed',
            ]);

        $response->assertOk();
        $response->assertJson(['status' => 'confirmed']);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'confirmed']);
    }

    public function test_update_order_status_invalid_transition(): void
    {
        $order = Order::create([
            'restaurant_id' => $this->restaurant->id,
            'table_number' => '3',
            'status' => 'completed',
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->patchJson("/api/restaurants/{$this->restaurant->id}/orders/{$order->id}/status", [
                'status' => 'pending',
            ]);

        $response->assertStatus(409);
    }

    public function test_update_order_status_invalid_value(): void
    {
        $order = Order::create([
            'restaurant_id' => $this->restaurant->id,
            'table_number' => '3',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->patchJson("/api/restaurants/{$this->restaurant->id}/orders/{$order->id}/status", [
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422);
    }

    public function test_update_order_not_found(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->patchJson("/api/restaurants/{$this->restaurant->id}/orders/99999/status", [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(404);
    }
}
