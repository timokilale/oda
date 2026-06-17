<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['menu_items', 'restaurants', 'pending_owner_registrations'] as $table) {
            if (Schema::hasColumn($table, 'image_path')) {
                DB::table($table)
                    ->where('image_path', 'LIKE', '/uploads/%')
                    ->update([
                        'image_path' => DB::raw("REPLACE(image_path, '/uploads/', '/storage/')"),
                    ]);
            }
        }
    }

    public function down(): void
    {
        foreach (['menu_items', 'restaurants', 'pending_owner_registrations'] as $table) {
            if (Schema::hasColumn($table, 'image_path')) {
                DB::table($table)
                    ->where('image_path', 'LIKE', '/storage/%')
                    ->update([
                        'image_path' => DB::raw("REPLACE(image_path, '/storage/', '/uploads/')"),
                    ]);
            }
        }
    }
};
