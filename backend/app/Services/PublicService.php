<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Illuminate\Support\Facades\DB;

class PublicService
{
    public function getOrderContext(string $ref, string $tableRef): array
    {
        $restaurant = $this->resolveRestaurant($ref);
        $tableNumber = $this->resolveTable($restaurant->id, $tableRef);

        if (!$tableNumber) {
            abort(404, 'Table not found.');
        }

        $items = MenuItem::where('restaurant_id', $restaurant->id)
            ->where('active', 1)
            ->orderBy('id')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'restaurantId' => $item->restaurant_id,
                    'name' => $item->name,
                    'description' => $item->description,
                    'price' => (float) $item->price,
                    'category' => $item->category,
                    'active' => true,
                    'imageUrl' => $item->image_path,
                    'imagePositionX' => (float) ($item->image_position_x ?? 50),
                    'imagePositionY' => (float) ($item->image_position_y ?? 50),
                ];
            })
            ->toArray();

        return [
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'publicSlug' => $restaurant->public_slug,
                'active' => $restaurant->active,
                'imageUrl' => $restaurant->image_path,
                'imagePositionX' => (float) ($restaurant->image_position_x ?? 50),
                'imagePositionY' => (float) ($restaurant->image_position_y ?? 50),
            ],
            'tableNumber' => $tableNumber,
            'menuItems' => $items,
            'menuTree' => $this->buildMenuTree($items),
        ];
    }

    public function placeOrder(string $ref, string $tableRef, array $submittedItems): array
    {
        $restaurant = $this->resolveRestaurant($ref);

        $normalized = [];
        foreach ($submittedItems as $item) {
            $id = (int) ($item['id'] ?? 0);
            $qty = (int) ($item['quantity'] ?? 0);
            if ($id > 0 && $qty > 0) {
                if ($qty > 20) {
                    abort(400, 'Maximum quantity per item is 20.');
                }
                $normalized[] = ['id' => $id, 'quantity' => $qty];
            }
        }

        if (empty($normalized)) {
            abort(400, 'No items selected.');
        }

        return DB::transaction(function () use ($restaurant, $tableRef, $normalized) {
            $resolvedTable = $this->resolveTable($restaurant->id, $tableRef);
            if (!$resolvedTable) {
                abort(404, 'Unknown table QR code.');
            }

            $ids = array_column($normalized, 'id');
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $menuRows = DB::select(
                "SELECT id FROM menu_items WHERE restaurant_id = ? AND active = 1 AND id IN ({$placeholders})",
                array_merge([$restaurant->id], $ids)
            );

            if (count($menuRows) !== count($normalized)) {
                abort(400, 'One or more selected menu items are invalid.');
            }

            $orderId = DB::table('orders')->insertGetId([
                'restaurant_id' => $restaurant->id,
                'table_number' => $resolvedTable,
                'status' => 'pending',
            ]);

            foreach ($normalized as $item) {
                DB::table('order_items')->insert([
                    'order_id' => $orderId,
                    'menu_item_id' => $item['id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return [
                'id' => $orderId,
                'tableNumber' => $resolvedTable,
            ];
        });
    }

    public function getTableOrders(string $ref, string $tableRef): array
    {
        $restaurant = $this->resolveRestaurant($ref);
        $tableNumber = $this->resolveTable($restaurant->id, $tableRef);
        if (!$tableNumber) {
            abort(404, 'Table not found.');
        }

        $orders = DB::table('orders')
            ->where('restaurant_id', $restaurant->id)
            ->where('table_number', $tableNumber)
            ->orderByDesc('id')
            ->get();

        if ($orders->isEmpty()) {
            return ['orders' => []];
        }

        $orderIds = $orders->pluck('id');

        $items = DB::table('order_items')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->whereIn('order_items.order_id', $orderIds)
            ->select(
                'order_items.order_id',
                'order_items.quantity',
                'menu_items.id as menu_item_id',
                'menu_items.name',
                'menu_items.price',
            )
            ->get()
            ->groupBy('order_id');

        $menuItemNames = [];
        foreach ($items as $orderId => $orderItems) {
            $menuItemNames[$orderId] = $orderItems->map(fn($i) => [
                'name' => $i->name,
                'quantity' => (int) $i->quantity,
                'price' => (float) $i->price,
            ]);
        }

        $mapped = $orders->map(function ($order) use ($menuItemNames) {
            $orderId = $order->id;
            $orderItems = $menuItemNames[$orderId] ?? collect();

            $total = $orderItems->sum(fn($i) => $i['price'] * $i['quantity']);

            return [
                'id' => $orderId,
                'status' => $order->status,
                'createdAt' => $order->created_at,
                'totalAmount' => $total,
                'items' => $orderItems->toArray(),
            ];
        });

        return ['orders' => $mapped->toArray()];
    }

    private function resolveRestaurant(string $ref): Restaurant
    {
        $restaurant = Restaurant::where('public_slug', $ref)->orWhere('id', $ref)->first();
        if (!$restaurant) {
            abort(404, 'Restaurant not found.');
        }
        if (!$restaurant->active) {
            abort(403, 'This restaurant is not currently accepting orders.');
        }
        return $restaurant;
    }

    private function resolveTable(string $restaurantId, string $tableRef): ?string
    {
        $ref = trim($tableRef);
        if (!$ref) return null;

        $candidates = [$ref];
        $prefix = $restaurantId . '-';
        if (str_starts_with($ref, $prefix)) {
            $legacy = trim(substr($ref, strlen($prefix)));
            if ($legacy && !in_array($legacy, $candidates)) {
                $candidates[] = $legacy;
            }
        }

        foreach ($candidates as $candidate) {
            $table = RestaurantTable::where('restaurant_id', $restaurantId)
                ->where('table_number', $candidate)
                ->first();
            if ($table) return $table->table_number;
        }

        if (preg_match('/^\d+$/', $ref)) {
            $table = RestaurantTable::where('restaurant_id', $restaurantId)
                ->where('id', (int) $ref)
                ->first();
            if ($table) return $table->table_number;
        }

        return null;
    }

    private function buildMenuTree(array $items): array
    {
        $root = [];

        foreach ($items as $item) {
            $segments = array_filter(array_map('trim', explode('>', $item['category'] ?? 'Other')));
            if (empty($segments)) $segments = ['Other'];

            $current = &$root;
            $lastIndex = count($segments) - 1;
            foreach ($segments as $i => $segment) {
                if (!isset($current[$segment])) {
                    $current[$segment] = ['name' => $segment, 'items' => [], 'children' => []];
                }
                if ($i === $lastIndex) {
                    $current[$segment]['items'][] = $item;
                } else {
                    $current = &$current[$segment]['children'];
                }
            }
        }

        $finalize = function (array $nodes) use (&$finalize): array {
            ksort($nodes);
            $result = [];
            foreach ($nodes as $node) {
                $result[] = [
                    'name' => $node['name'],
                    'items' => $node['items'],
                    'children' => $finalize($node['children']),
                ];
            }
            return $result;
        };

        return $finalize($root);
    }
}
