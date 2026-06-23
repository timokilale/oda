<?php

namespace App\Services;

use App\Models\Owner;
use App\Models\Restaurant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RestaurantService
{
    public function getOwnerRestaurants(int $ownerId): array
    {
        $owner = Owner::with(['restaurants' => function ($query) {
            $query->withCount([
                'menuItems as menu_item_count' => fn($q) => $q->where('active', 1),
                'tables as table_count',
                'orders as order_count',
                'orders as open_order_count' => fn($q) => $q->whereIn('status', ['pending', 'confirmed']),
            ])->orderBy('name')->orderBy('id');
        }])->findOrFail($ownerId);

        return $owner->restaurants->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'city' => $r->city,
            'country' => $r->country,
            'address' => $r->address,
            'phone' => $r->phone,
            'active' => (bool) $r->active,
            'publicSlug' => $r->public_slug,
            'imageUrl' => $r->image_path,
            'imagePositionX' => (float) ($r->image_position_x ?? 50),
            'imagePositionY' => (float) ($r->image_position_y ?? 50),
            'menuWrapperUrl' => $r->menu_wrapper_url,
            'menuItemCount' => (int) $r->menu_item_count,
            'tableCount' => (int) $r->table_count,
            'orderCount' => (int) $r->order_count,
            'openOrderCount' => (int) $r->open_order_count,
        ])->toArray();
    }

    public function getWorkspaceSummary(string $restaurantId): array
    {
        $restaurant = Restaurant::findOrFail($restaurantId);

        return [
            'menuItemCount' => $restaurant->menuItems()->where('active', 1)->count(),
            'tableCount' => $restaurant->tables()->count(),
            'totalOrderCount' => $restaurant->orders()->count(),
            'openOrderCount' => $restaurant->orders()->whereIn('status', ['pending', 'confirmed'])->count(),
        ];
    }

    public function createRestaurant(Owner $owner, array $data): Restaurant
    {
        $restaurantId = 'restaurant-' . $owner->id;
        $counter = 1;
        while (Restaurant::find($restaurantId)) {
            $restaurantId = 'restaurant-' . $owner->id . '-' . substr(Str::uuid()->toString(), 0, 8);
            $counter++;
            if ($counter > 10) break;
        }

        $slug = Str::slug($data['restaurantName']);
        $baseSlug = $slug;
        $suffix = 2;
        while (Restaurant::where('public_slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        $restaurant = Restaurant::create([
            'id' => $restaurantId,
            'name' => $data['restaurantName'],
            'public_slug' => $slug,
            'city' => ($data['city'] ?? '') ?: null,
            'country' => ($data['country'] ?? '') ?: null,
            'image_path' => $data['imagePath'] ?? null,
            'image_position_x' => (float) ($data['imagePositionX'] ?? 50),
            'image_position_y' => (float) ($data['imagePositionY'] ?? 50),
            'active' => true,
        ]);

        DB::table('owner_restaurants')->insert([
            'owner_id' => $owner->id,
            'restaurant_id' => $restaurant->id,
        ]);

        return $restaurant;
    }

    public function updateRestaurant(Restaurant $restaurant, array $data): Restaurant
    {
        $imagePath = $data['imagePath'] ?? '__NULL_SENTINEL__';

        $restaurant->update([
            'name' => $data['name'],
            'address' => ($data['address'] ?? '') ?: null,
            'city' => ($data['city'] ?? '') ?: null,
            'country' => ($data['country'] ?? '') ?: null,
            'phone' => $data['phone'] ?? $restaurant->phone,
            'active' => $data['active'] ?? $restaurant->active,
            'menu_wrapper_url' => $data['menu_wrapper_url'] ?? $restaurant->menu_wrapper_url,
            'image_path' => $imagePath !== '__NULL_SENTINEL__' ? $imagePath : $restaurant->image_path,
            'image_position_x' => $imagePath !== '__NULL_SENTINEL__'
                ? (float) ($data['imagePositionX'] ?? $restaurant->image_position_x ?? 50)
                : 50,
            'image_position_y' => $imagePath !== '__NULL_SENTINEL__'
                ? (float) ($data['imagePositionY'] ?? $restaurant->image_position_y ?? 50)
                : 50,
        ]);

        return $restaurant->fresh();
    }
}
