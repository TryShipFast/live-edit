<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How close to expiry a site was last warned.
 *
 * Without it a daily job either says nothing or says the same thing every
 * morning for a month, and the second is worse: a customer who is emailed
 * daily about a licence with three weeks left stops reading anything we send,
 * including the message that matters on the last day.
 *
 * The number is the threshold it was warned at (30, 7, 1, or 0 for expired),
 * so a notice is sent once per step down and never repeats.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->unsignedSmallInteger('renewal_notice_days')->nullable()->after('verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->dropColumn('renewal_notice_days');
        });
    }
};
