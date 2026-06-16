<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('owners', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number', 32)->nullable();
            $table->string('email', 191)->nullable()->unique();
            $table->string('password_hash', 255)->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->boolean('is_admin')->default(false);
            $table->boolean('can_manage_multiple_restaurants')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('owners');
    }
};
