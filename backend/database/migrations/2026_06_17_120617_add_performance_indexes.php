<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['restaurant_id', 'id'], 'idx_orders_restaurant_id_id');
            $table->index(['restaurant_id', 'status', 'created_at'], 'idx_orders_restaurant_status_created');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['restaurant_id', 'active', 'id'], 'idx_menu_items_restaurant_active_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index(['order_id', 'menu_item_id'], 'idx_order_items_order_menu');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_restaurant_id_id');
            $table->dropIndex('idx_orders_restaurant_status_created');
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex('idx_menu_items_restaurant_active_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_order_menu');
        });
    }
};
