<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function restaurants()
    {
        $rows = DB::select("
            SELECT id, name, public_slug, city, country, active
            FROM restaurants
            ORDER BY id
            LIMIT 100
        ");

        return response()->json(
            array_map(fn($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'publicSlug' => $row->public_slug,
                'city' => $row->city,
                'country' => $row->country,
                'active' => (bool) $row->active,
            ], $rows)
        );
    }

    public function menuTemplate(string $restaurantId)
    {
        $rows = DB::select("
            SELECT name, price, description, category
            FROM menu_items
            WHERE restaurant_id = ? AND active = 1
            ORDER BY id
        ", [$restaurantId]);

        return response()->json(
            array_map(fn($row) => [
                'name' => $row->name,
                'price' => (float) $row->price,
                'description' => $row->description,
                'category' => $row->category,
            ], $rows)
        );
    }
}
