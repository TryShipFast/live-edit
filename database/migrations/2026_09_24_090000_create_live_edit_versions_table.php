<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A published state of the whole site.
 *
 * Every publish writes an immutable snapshot and records it here, so history is
 * a list of things that were once live rather than a log of individual changes.
 * That is what makes rolling back a single decision — repoint at an earlier
 * version — instead of unpicking edits one at a time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('number')->unique();
            // Which locales the snapshot holds, and how many values in each.
            $table->json('locales');
            $table->unsignedInteger('changes')->default(0);
            // Set when this version is a return to an earlier one.
            $table->unsignedInteger('restored_from')->nullable();
            $table->string('published_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_versions');
    }
};
