<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The fallback store for a host with no settings table of its own.
 *
 * Deliberately not named `settings`: that is a name applications choose for
 * themselves all the time, and a package that claimed it would collide with
 * the host on exactly the sites most likely to already have one.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('live_edit_settings')) {
            return;
        }

        Schema::create('live_edit_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            // Long, because this holds page copy rather than configuration —
            // a paragraph of marketing prose does not fit in a short column.
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_settings');
    }
};
