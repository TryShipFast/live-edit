<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('element_styles', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('props');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('element_styles');
    }
};
