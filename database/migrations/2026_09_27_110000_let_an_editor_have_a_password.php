<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A password for signing in to edit.
 *
 * Signing in was a link sent by email, which is the better idea and stays:
 * nothing to choose, nothing to forget, nothing worth stealing from our
 * database. It needs working mail, though, and a customer cannot edit their
 * own site while we are still wiring up an SMTP account.
 *
 * Nullable, so the two can live side by side. An editor with no password can
 * only ever be sent a link, which is the safe default for somebody added by
 * an administrator who should not be inventing passwords on their behalf.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->dropColumn('password');
        });
    }
};
