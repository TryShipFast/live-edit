<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            // Public half of the key: indexed, so authenticating is one read
            // rather than a comparison against every token on the system.
            $table->string('public_id', 32)->unique();
            $table->string('type', 16);
            $table->string('name');
            // Only ever a hash. A leaked database should not hand anyone a
            // working key.
            $table->string('secret_hash', 64);
            $table->json('abilities');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_api_tokens');
    }
};
