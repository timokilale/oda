<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Owner;
use App\Models\OwnerAuthToken;
use App\Models\Restaurant;
use Tests\TestCase;

class ReportTest extends TestCase
{
    private Owner $owner;
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
        $this->restaurant = Restaurant::create([
            'id' => 'restaurant-report-test',
            'name' => 'Report Test',
            'public_slug' => 'report-test',
            'active' => true,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->owner->id,
            'restaurant_id' => $this->restaurant->id,
        ]);
    }

    private function authCookie(): array
    {
        $rawToken = 'test-raw-token-' . uniqid();
        OwnerAuthToken::create([
            'owner_id' => $this->owner->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => now()->addDays(30),
        ]);
        return ['Authorization' => 'Bearer ' . $rawToken];
    }

    public function test_report_with_no_orders(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/reports");

        $response->assertOk();
        $response->assertJson(['reports' => [
            'totalOrders' => 0,
            'revenueTotal' => 0.0,
            'topItems' => [],
        ]]);
    }

    public function test_report_with_orders(): void
    {
        $item = MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Report Item',
            'price' => 25,
            'category' => 'Main',
            'active' => true,
        ]);

        $order = Order::create([
            'restaurant_id' => $this->restaurant->id,
            'table_number' => '1',
            'status' => 'completed',
        ]);

        \Illuminate\Support\Facades\DB::table('order_items')->insert([
            'order_id' => $order->id,
            'menu_item_id' => $item->id,
            'quantity' => 3,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$this->restaurant->id}/reports");

        $response->assertOk();
        $response->assertJson(['reports' => [
            'totalOrders' => 1,
            'revenueTotal' => 75.0,
            'totalOrders' => 1,
        ]]);
    }

    public function test_report_forbidden(): void
    {
        $otherRestaurant = Restaurant::create([
            'id' => 'restaurant-other-report',
            'name' => 'Other',
            'public_slug' => 'other',
            'active' => true,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$otherRestaurant->id}/reports");

        $response->assertStatus(403);
    }
}
