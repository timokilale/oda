<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('owner_auth_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_id');
            $table->string('token_hash', 64);
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('token_hash');
            $table->index('owner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('owner_auth_tokens');
    }
};
