<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->text('ingredients')->nullable()->after('description');
            $table->unsignedInteger('calories')->nullable()->after('price');
            $table->unsignedInteger('prep_time')->nullable()->after('calories');
            $table->unsignedTinyInteger('spiciness')->nullable()->after('prep_time');
            $table->string('badges', 255)->nullable()->after('spiciness');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['ingredients', 'calories', 'prep_time', 'spiciness', 'badges']);
        });
    }
};
