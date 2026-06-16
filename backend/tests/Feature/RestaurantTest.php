<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Owner;
use App\Models\OwnerAuthToken;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Tests\TestCase;

class RestaurantTest extends TestCase
{
    private Owner $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = Owner::create(['phone_number' => '+1234567890', 'phone_verified_at' => now()]);
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

    public function test_list_restaurants_empty(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->getJson('/api/restaurants');

        $response->assertOk();
        $response->assertJson([
            'restaurants' => [],
            'ownerCanAddRestaurant' => true,
        ]);
    }

    public function test_create_restaurant(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->postJson('/api/restaurants', [
                'restaurantName' => 'New Restaurant',
                'city' => 'Paris',
                'country' => 'France',
            ]);

        $response->assertCreated();
        $response->assertJsonFragment(['name' => 'New Restaurant']);

        $this->assertDatabaseHas('restaurants', ['name' => 'New Restaurant']);
    }

    public function test_create_restaurant_requires_name(): void
    {
        $response = $this->withHeaders($this->authCookie())
            ->postJson('/api/restaurants', []);

        $response->assertStatus(422);
    }

    public function test_show_restaurant(): void
    {
        $restaurant = Restaurant::create([
            'id' => 'restaurant-1',
            'name' => 'Test Restaurant',
            'public_slug' => 'test-restaurant',
            'active' => true,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->owner->id,
            'restaurant_id' => $restaurant->id,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$restaurant->id}");

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Test Restaurant']);
        $response->assertJsonStructure(['workspaceSummary']);
    }

    public function test_show_restaurant_forbidden(): void
    {
        $restaurant = Restaurant::create([
            'id' => 'restaurant-other',
            'name' => 'Other',
            'public_slug' => 'other',
            'active' => true,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson("/api/restaurants/{$restaurant->id}");

        $response->assertStatus(403);
    }

    public function test_update_restaurant(): void
    {
        $restaurant = Restaurant::create([
            'id' => 'restaurant-update',
            'name' => 'Original',
            'public_slug' => 'original',
            'active' => true,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->owner->id,
            'restaurant_id' => $restaurant->id,
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->patchJson("/api/restaurants/{$restaurant->id}", [
                'name' => 'Updated Name',
                'address' => '123 Street',
            ]);

        $response->assertOk();
        $response->assertJsonFragment(['name' => 'Updated Name']);

        $this->assertDatabaseHas('restaurants', ['name' => 'Updated Name']);
    }

    public function test_list_restaurants_with_counts(): void
    {
        $restaurant = Restaurant::create([
            'id' => 'restaurant-counts',
            'name' => 'Count Test',
            'public_slug' => 'count-test',
            'active' => true,
        ]);

        \Illuminate\Support\Facades\DB::table('owner_restaurants')->insert([
            'owner_id' => $this->owner->id,
            'restaurant_id' => $restaurant->id,
        ]);

        MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Item 1',
            'price' => 10,
            'category' => 'Main',
            'active' => true,
        ]);

        RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'table_number' => '1',
        ]);

        $response = $this->withHeaders($this->authCookie())
            ->getJson('/api/restaurants');

        $response->assertOk();
        $response->assertJsonFragment(['menuItemCount' => 1]);
        $response->assertJsonFragment(['tableCount' => 1]);
    }
}
