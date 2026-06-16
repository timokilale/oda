<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('name', 191);
            $table->string('public_slug', 191)->unique();
            $table->string('address', 255)->nullable();
            $table->string('city', 191)->nullable();
            $table->string('country', 191)->nullable();
            $table->string('phone', 80)->nullable();
            $table->boolean('active')->default(true);
            $table->string('image_path', 255)->nullable();
            $table->decimal('image_position_x', 5, 2)->default(50);
            $table->decimal('image_position_y', 5, 2)->default(50);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
