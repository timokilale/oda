<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->string('restaurant_id', 80);
            $table->string('table_number', 120);
            $table->string('qr_code_path', 255)->nullable();
            $table->string('qr_target_url', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('restaurant_id')->references('id')->on('restaurants')->onDelete('cascade');
            $table->unique(['restaurant_id', 'table_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};
