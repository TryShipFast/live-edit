<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which keys sit inside a region the developer locked.
 *
 * data-live-lock worked by declining to offer something: the scanner did not
 * mark a locked region, so an invited editor was never shown it. That is a
 * guardrail, and a good one, but it is not a boundary. Nothing re-checked it
 * when the change arrived, and the write endpoint takes a key rather than a
 * page, so it had nothing to check against. An invited editor who knew a key
 * inside the nav could set it, and the feature is sold as handing over a site
 * without handing over the nav.
 *
 * The page is the only place that knows the shape, and it is only in hand
 * while it is being tagged. So the full scan - the one every ordinary visitor
 * already triggers, because a page tagged for nobody in particular is tagged
 * in full - writes down what it found behind a lock, and the write path reads
 * it back.
 *
 * Per page, because a lock is a position in one page's markup, and keyed to
 * the site so one customer's locks can never answer for another's.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_locked_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->string('page')->default('');
            // The keys themselves, not a count: the write path asks "is this
            // one of them" and must answer without the page in hand.
            $table->json('keys');
            $table->timestamps();

            $table->unique(['site_id', 'page']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_locked_keys');
    }
};
