<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('restaurant_id', 80);
            $table->string('name', 191);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('category', 191);
            $table->boolean('active')->default(true);
            $table->string('image_path', 255)->nullable();
            $table->decimal('image_position_x', 5, 2)->default(50);
            $table->decimal('image_position_y', 5, 2)->default(50);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('restaurant_id')->references('id')->on('restaurants')->onDelete('cascade');
            $table->index('restaurant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
