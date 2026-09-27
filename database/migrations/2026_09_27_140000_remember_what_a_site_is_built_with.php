<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the site is built with, asked once and then remembered.
 *
 * The console used to show every platform's instructions behind a row of
 * tabs, so a customer who had just said "WordPress" was handed four sets of
 * instructions and left to pick. A key belongs to one site, and a site is
 * built with one thing: the question has an answer, and asking it at
 * registration turns four possibilities on screen into one instruction.
 *
 * Nullable, because every site registered before this was asked nothing. They
 * keep the chooser until somebody tells us, which is the honest way to say "we
 * do not know yet" without guessing wrong on their behalf.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->string('platform', 20)->nullable()->after('domain');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->dropColumn('platform');
        });
    }
};
