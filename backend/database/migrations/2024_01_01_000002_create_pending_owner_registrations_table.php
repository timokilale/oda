<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pending_owner_registrations', function (Blueprint $table) {
            $table->string('phone_number', 32)->primary();
            $table->string('restaurant_name', 191);
            $table->string('city', 191)->nullable();
            $table->string('country', 191)->nullable();
            $table->string('image_path', 255)->nullable();
            $table->decimal('image_position_x', 5, 2)->default(50);
            $table->decimal('image_position_y', 5, 2)->default(50);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_owner_registrations');
    }
};
