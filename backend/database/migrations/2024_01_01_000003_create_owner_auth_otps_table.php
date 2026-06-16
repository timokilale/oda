<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('owner_auth_otps', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number', 32);
            $table->string('purpose', 40);
            $table->string('request_ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('code_hash', 255);
            $table->unsignedTinyInteger('attempt_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['phone_number', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('owner_auth_otps');
    }
};
