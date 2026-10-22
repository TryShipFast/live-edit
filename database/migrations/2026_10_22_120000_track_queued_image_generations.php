<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_image_generations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->text('prompt');
            $table->string('status', 20)->index();
            $table->json('images')->nullable();
            $table->string('reason', 40)->nullable();
            $table->unsignedInteger('balance')->nullable();
            $table->timestamps();
            $table->index(['site_id', 'uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_image_generations');
    }
};
