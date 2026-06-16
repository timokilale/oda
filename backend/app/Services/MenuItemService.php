<?php

namespace App\Services;

use App\Models\MenuItem;
use Illuminate\Support\Facades\DB;

class MenuItemService
{
    public function getMenuItems(string $restaurantId): array
    {
        $items = MenuItem::where('restaurant_id', $restaurantId)
            ->orderByRaw('active DESC, category, name, id DESC')
            ->get()
            ->map(fn($item) => $this->formatItem($item))
            ->toArray();

        return $items;
    }

    public function getCategorySuggestions(string $restaurantId): array
    {
        $categories = DB::table('menu_items')
            ->where('restaurant_id', $restaurantId)
            ->where('active', 1)
            ->distinct()
            ->pluck('category')
            ->toArray();

        return array_values(array_unique(array_merge(
            ['Main dishes', 'Starters', 'Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Drinks', 'Sides', 'Specials', 'Other'],
            $categories
        )));
    }

    public function createMenuItem(string $restaurantId, array $data): MenuItem
    {
        return MenuItem::create([
            'restaurant_id' => $restaurantId,
            'name' => $data['name'],
            'description' => ($data['description'] ?? '') ?: null,
            'price' => (float) $data['price'],
            'category' => $data['category'],
            'image_path' => $data['imagePath'] ?? null,
            'image_position_x' => (float) ($data['imagePositionX'] ?? 50),
            'image_position_y' => (float) ($data['imagePositionY'] ?? 50),
            'active' => true,
        ]);
    }

    public function updateMenuItem(MenuItem $item, array $data): MenuItem
    {
        $imagePath = $data['imagePath'] ?? '__NULL_SENTINEL__';

        $item->update([
            'name' => $data['name'],
            'description' => ($data['description'] ?? '') ?: null,
            'price' => (float) $data['price'],
            'category' => $data['category'],
            'active' => $data['active'] ?? $item->active,
            'image_path' => $imagePath !== '__NULL_SENTINEL__' ? $imagePath : $item->image_path,
            'image_position_x' => $imagePath !== '__NULL_SENTINEL__'
                ? (float) ($data['imagePositionX'] ?? $item->image_position_x ?? 50)
                : 50,
            'image_position_y' => $imagePath !== '__NULL_SENTINEL__'
                ? (float) ($data['imagePositionY'] ?? $item->image_position_y ?? 50)
                : 50,
        ]);

        return $item->fresh();
    }

    public function deleteMenuItem(MenuItem $item): void
    {
        $refCount = DB::table('order_items')->where('menu_item_id', $item->id)->count();

        if ($refCount > 0) {
            $item->update(['active' => 0]);
        } else {
            $item->delete();
        }
    }

    public function formatItem($item): array
    {
        return [
            'id' => $item->id,
            'restaurantId' => $item->restaurant_id,
            'name' => $item->name,
            'description' => $item->description,
            'price' => (float) $item->price,
            'category' => $item->category,
            'active' => (bool) $item->active,
            'imageUrl' => $item->image_path,
            'imagePositionX' => (float) ($item->image_position_x ?? 50),
            'imagePositionY' => (float) ($item->image_position_y ?? 50),
        ];
    }
}
