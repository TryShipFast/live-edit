<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_media_imports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->string('token_public_id', 64);
            $table->string('target', 200)->nullable();
            $table->string('source_disk', 64)->nullable();
            $table->string('source_path', 500)->nullable();
            $table->text('source_url')->nullable();
            $table->json('options');
            $table->string('status', 20)->index();
            $table->text('url')->nullable();
            $table->string('reason', 80)->nullable();
            $table->timestamps();
            $table->index(['site_id', 'uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_media_imports');
    }
};
