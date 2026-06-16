<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Tests\TestCase;

class PublicTest extends TestCase
{
    private Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->restaurant = Restaurant::create([
            'id' => 'restaurant-public-test',
            'name' => 'Public Test',
            'public_slug' => 'public-test',
            'active' => true,
        ]);

        RestaurantTable::create([
            'restaurant_id' => $this->restaurant->id,
            'table_number' => '1',
        ]);

        MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Burger',
            'price' => 15,
            'category' => 'Main dishes',
            'active' => true,
        ]);

        MenuItem::create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Fries',
            'price' => 5,
            'category' => 'Sides',
            'active' => true,
        ]);
    }

    public function test_order_context(): void
    {
        $response = $this->getJson("/api/public/restaurants/public-test/order-context?table=1");

        $response->assertOk();
        $response->assertJsonStructure([
            'restaurant' => ['id', 'name', 'publicSlug'],
            'tableNumber',
            'menuItems',
            'menuTree',
        ]);
        $response->assertJsonCount(2, 'menuItems');
        $response->assertJsonFragment(['tableNumber' => '1']);
    }

    public function test_order_context_missing_table(): void
    {
        $response = $this->getJson("/api/public/restaurants/public-test/order-context");
        $response->assertStatus(400);
    }

    public function test_order_context_unknown_table(): void
    {
        $response = $this->getJson("/api/public/restaurants/public-test/order-context?table=999");
        $response->assertStatus(404);
    }

    public function test_order_context_inactive_restaurant(): void
    {
        $inactive = Restaurant::create([
            'id' => 'restaurant-inactive',
            'name' => 'Inactive',
            'public_slug' => 'inactive',
            'active' => false,
        ]);

        $response = $this->getJson("/api/public/restaurants/inactive/order-context?table=1");
        $response->assertStatus(403);
    }

    public function test_place_order(): void
    {
        $items = MenuItem::where('restaurant_id', $this->restaurant->id)->get();

        $response = $this->postJson("/api/public/restaurants/public-test/orders", [
            'tableNumber' => '1',
            'items' => [
                ['id' => $items[0]->id, 'quantity' => 2],
                ['id' => $items[1]->id, 'quantity' => 1],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonStructure(['orderId', 'tableNumber', 'status', 'successMessage']);
        $response->assertJson(['status' => 'pending']);

        $this->assertDatabaseHas('orders', ['id' => $response->json('orderId')]);
    }

    public function test_place_order_missing_table(): void
    {
        $response = $this->postJson("/api/public/restaurants/public-test/orders", [
            'items' => [],
        ]);

        $response->assertStatus(400);
    }

    public function test_place_order_exceeds_quantity_limit(): void
    {
        $items = MenuItem::where('restaurant_id', $this->restaurant->id)->get();

        $response = $this->postJson("/api/public/restaurants/public-test/orders", [
            'tableNumber' => '1',
            'items' => [
                ['id' => $items[0]->id, 'quantity' => 21],
            ],
        ]);

        $response->assertStatus(400);
    }

    public function test_place_order_invalid_item(): void
    {
        $response = $this->postJson("/api/public/restaurants/public-test/orders", [
            'tableNumber' => '1',
            'items' => [
                ['id' => 99999, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(400);
    }

    public function test_place_order_to_inactive_restaurant(): void
    {
        $inactive = Restaurant::create([
            'id' => 'restaurant-inactive-2',
            'name' => 'Inactive 2',
            'public_slug' => 'inactive-2',
            'active' => false,
        ]);

        $response = $this->postJson("/api/public/restaurants/inactive-2/orders", [
            'tableNumber' => '1',
            'items' => [['id' => 1, 'quantity' => 1]],
        ]);

        $response->assertStatus(403);
    }
}
