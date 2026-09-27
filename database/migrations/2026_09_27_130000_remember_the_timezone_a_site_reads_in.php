<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The timezone a site's people read dates in.
 *
 * It began as the console application's own column, which was right while the
 * only thing reading it was a page. It stopped being right when this package
 * started sending renewal notices: an email is rendered hours before it is
 * opened, so there is no browser to convert the date later, and "your licence
 * ends on 1 March" arriving a day out is the one mistake that message cannot
 * afford.
 *
 * So it belongs here, with the thing that needs it. Guarded, because the
 * console already added it and whichever runs first should win.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('live_edit_sites', 'timezone')) {
            return;
        }

        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->string('timezone', 64)->nullable();
        });
    }

    /**
     * Deliberately empty.
     *
     * Rolling back would drop a column the console may have created, taking
     * every customer's timezone with it. A migration that can destroy data it
     * did not create is worse than one that cannot be reversed.
     */
    public function down(): void {}
};
