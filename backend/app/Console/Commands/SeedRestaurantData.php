<?php

namespace App\Console\Commands;

use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedRestaurantData extends Command
{
    protected $signature = 'app:seed-restaurant {restaurant?}';
    protected $description = 'Seed tables and menu items for a restaurant';

    private array $menuItems = [
        'Starters' => [
            ['name' => 'Oyster Rockefeller', 'description' => 'Freshly shucked oysters topped with spinach, parmesan, and herb butter, baked golden', 'price' => 28000, 'image' => 'https://images.unsplash.com/photo-1590691566902-c6e195b81e14?w=400&h=400&fit=crop'],
            ['name' => 'Beef Carpaccio', 'description' => 'Thinly sliced aged beef tenderloin with arugula, shaved parmesan, and truffle oil', 'price' => 32000, 'image' => 'https://images.unsplash.com/photo-1615937722923-67f6deaf2cc9?w=400&h=400&fit=crop'],
            ['name' => 'Tuna Tartare', 'description' => 'Diced sushi-grade tuna with avocado, sesame, ginger, and crispy wonton chips', 'price' => 35000, 'image' => 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=400&fit=crop'],
            ['name' => 'Crab Cakes', 'description' => 'Lump crab meat with citrus aioli and micro greens', 'price' => 26000, 'image' => 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&h=400&fit=crop'],
            ['name' => 'Foie Gras Terrine', 'description' => 'Silky foie gras with fig compote and toasted brioche', 'price' => 45000, 'image' => 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=400&fit=crop'],
            ['name' => 'Grilled Octopus', 'description' => 'Tender Mediterranean octopus with smoked paprika, lemon, and olive oil', 'price' => 30000, 'image' => 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=400&fit=crop'],
            ['name' => 'Bruschetta Trio', 'description' => 'Heirloom tomato, wild mushroom, and roasted pepper bruschetta on sourdough', 'price' => 18000, 'image' => 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=400&fit=crop'],
        ],
        'Soups & Salads' => [
            ['name' => 'Lobster Bisque', 'description' => 'Creamy lobster soup with cognac and chive oil', 'price' => 22000, 'image' => 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=400&h=400&fit=crop'],
            ['name' => 'Caesar Salad', 'description' => 'Romaine, house-made caesar dressing, croutons, and shaved parmesan', 'price' => 16000, 'image' => 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=400&fit=crop'],
            ['name' => 'Truffle Mushroom Soup', 'description' => 'Wild mushroom velouté with black truffle oil and crème fraîche', 'price' => 20000, 'image' => 'https://images.unsplash.com/photo-1586997588688-0527b36c318f?w=400&h=400&fit=crop'],
            ['name' => 'Waldorf Salad', 'description' => 'Crisp apple, celery, walnuts, and grapes in a creamy dressing', 'price' => 18000, 'image' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop'],
        ],
        'Mains' => [
            ['name' => 'Wagyu Ribeye 300g', 'description' => 'Japanese A5 Wagyu ribeye with truffle mashed potatoes and seasonal vegetables', 'price' => 85000, 'image' => 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=400&fit=crop'],
            ['name' => 'Lamb Rack', 'description' => 'Herb-crusted New Zealand lamb rack with mint jus and roasted root vegetables', 'price' => 65000, 'image' => 'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=400&h=400&fit=crop'],
            ['name' => 'Pan-Seared Salmon', 'description' => 'Atlantic salmon with lemon butter sauce, asparagus, and dill potatoes', 'price' => 42000, 'image' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop'],
            ['name' => 'Lobster Thermidor', 'description' => 'Whole lobster in creamy mustard sauce, gratinéed with gruyère', 'price' => 78000, 'image' => 'https://images.unsplash.com/photo-1559827291-baf8d3cac4dd?w=400&h=400&fit=crop'],
            ['name' => 'Duck Confit', 'description' => 'Slow-cooked duck leg with crispy skin, orange glaze, and wild rice pilaf', 'price' => 48000, 'image' => 'https://images.unsplash.com/photo-1432139509613-5c4255a1d1b8?w=400&h=400&fit=crop'],
            ['name' => 'Vegetable Risotto', 'description' => 'Carnaroli risotto with seasonal vegetables, parmesan, and truffle oil', 'price' => 32000, 'image' => 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=400&fit=crop'],
            ['name' => 'Beef Fillet', 'description' => '200g center-cut fillet mignon with peppercorn sauce and gratin dauphinois', 'price' => 58000, 'image' => 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop'],
            ['name' => 'Grilled Sea Bass', 'description' => 'Mediterranean sea bass with salsa verde, cherry tomatoes, and olives', 'price' => 46000, 'image' => 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=400&fit=crop'],
        ],
        'Desserts' => [
            ['name' => 'Crème Brûlée', 'description' => 'Classic vanilla crème brûlée with caramelized sugar top and fresh berries', 'price' => 15000, 'image' => 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=400&h=400&fit=crop'],
            ['name' => 'Chocolate Lava Cake', 'description' => 'Warm dark chocolate cake with molten center and vanilla ice cream', 'price' => 18000, 'image' => 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop'],
            ['name' => 'Tiramisu', 'description' => 'Classic Italian tiramisu with mascarpone and espresso-soaked ladyfingers', 'price' => 16000, 'image' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop'],
            ['name' => 'Mango Panna Cotta', 'description' => 'Silky panna cotta with fresh mango coulis and mint', 'price' => 14000, 'image' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop'],
            ['name' => 'Cheesecake du Jour', 'description' => 'New York style cheesecake with seasonal fruit topping', 'price' => 16000, 'image' => 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=400&fit=crop'],
        ],
        'Beverages' => [
            ['name' => 'Fresh Orange Juice', 'description' => 'Freshly squeezed Valencia oranges', 'price' => 8000, 'image' => 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop'],
            ['name' => 'Mango Smoothie', 'description' => 'Creamy mango and yogurt smoothie with honey', 'price' => 10000, 'image' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop'],
            ['name' => 'Espresso Martini', 'description' => 'Vodka, Kahlúa, and fresh espresso shaken to perfection', 'price' => 18000, 'image' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop'],
            ['name' => 'Passion Fruit Mocktail', 'description' => 'Sparkling passion fruit, lime, and mint with soda', 'price' => 12000, 'image' => 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=400&fit=crop'],
            ['name' => 'Red Wine — Cabernet', 'description' => 'Napa Valley Cabernet Sauvignon, full-bodied with dark fruit notes', 'price' => 25000, 'image' => 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=400&fit=crop'],
            ['name' => 'White Wine — Sauvignon Blanc', 'description' => 'Marlborough Sauvignon Blanc, crisp and citrusy', 'price' => 22000, 'image' => 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=400&h=400&fit=crop'],
            ['name' => 'Tanzanian Coffee', 'description' => 'Single-origin Tanzanian Peaberry, French press', 'price' => 7000, 'image' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop'],
        ],
    ];

    public function handle()
    {
        $restaurantId = $this->argument('restaurant') ?? 'restaurant-1';

        $restaurant = Restaurant::find($restaurantId);
        if (!$restaurant) {
            $this->error("Restaurant '{$restaurantId}' not found.");
            return 1;
        }

        $this->info("Seeding data for: {$restaurant->name} ({$restaurantId})");

        $this->seedTables($restaurantId);
        $this->seedMenuItems($restaurantId);

        $this->newLine();
        $this->info('Done!');

        $summary = DB::table('restaurant_tables')
            ->where('restaurant_id', $restaurantId)
            ->count();
        $menuCount = DB::table('menu_items')
            ->where('restaurant_id', $restaurantId)
            ->count();
        $this->line("  Tables: {$summary}");
        $this->line("  Menu items: {$menuCount}");
        $this->newLine();
        $this->line("Visit: /order/{$restaurant->public_slug}?table=1");

        return 0;
    }

    private function seedTables(string $restaurantId): void
    {
        $existing = RestaurantTable::where('restaurant_id', $restaurantId)->count();
        if ($existing > 0) {
            $this->warn("  Skipping tables — {$existing} already exist.");
            return;
        }

        $tables = [];
        for ($i = 1; $i <= 12; $i++) {
            $tables[] = [
                'restaurant_id' => $restaurantId,
                'table_number' => (string) $i,
            ];
        }

        DB::table('restaurant_tables')->insert($tables);
        $this->info('  ✓ Seeded 12 tables (1–12)');
    }

    private function seedMenuItems(string $restaurantId): void
    {
        $existing = DB::table('menu_items')
            ->where('restaurant_id', $restaurantId)
            ->count();
        if ($existing > 0) {
            $this->warn("  Skipping menu items — {$existing} already exist.");
            return;
        }

        $items = [];
        foreach ($this->menuItems as $category => $dishes) {
            foreach ($dishes as $dish) {
                $items[] = [
                    'restaurant_id' => $restaurantId,
                    'name' => $dish['name'],
                    'description' => $dish['description'],
                    'price' => $dish['price'],
                    'category' => $category,
                    'active' => 1,
                    'image_path' => $dish['image'],
                    'image_position_x' => 50,
                    'image_position_y' => 50,
                ];
            }
        }

        foreach (array_chunk($items, 20) as $chunk) {
            DB::table('menu_items')->insert($chunk);
        }

        $total = count($items);
        $this->info("  ✓ Seeded {$total} menu items");
    }
}
