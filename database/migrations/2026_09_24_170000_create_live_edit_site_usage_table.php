<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What each site actually used, by month.
 *
 * Kept per period rather than as a running total, because an invoice is for a
 * month and a total cannot be un-added. It also means a dispute can be
 * answered — "what did we use in March" is a row, not a reconstruction.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_site_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            // "2026-09". A month is the unit an invoice is written in.
            $table->string('period', 7);

            // The things that cost something to do. Reads are deliberately not
            // here: they are cached and served from a CDN, and charging for
            // them would bill customers for the work done to avoid work.
            $table->unsignedBigInteger('writes')->default(0);
            $table->unsignedBigInteger('publishes')->default(0);
            $table->unsignedBigInteger('uploads')->default(0);
            // Bytes added this period. Storage is cumulative in reality, so
            // the running total lives on the site; this is what changed.
            $table->unsignedBigInteger('bytes_added')->default(0);

            $table->timestamps();
            $table->unique(['site_id', 'period']);
        });

        Schema::table('live_edit_sites', function (Blueprint $table) {
            // What this site is allowed, if anything. Null means no limit,
            // which is the right default: a limit nobody set should never be
            // the reason a customer cannot save.
            $table->json('limits')->nullable()->after('allowed_origins');
            $table->unsignedBigInteger('bytes_stored')->default(0)->after('limits');
            $table->timestamp('last_active_at')->nullable()->after('bytes_stored');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->dropColumn(['limits', 'bytes_stored', 'last_active_at']);
        });

        Schema::dropIfExists('live_edit_site_usage');
    }
};
