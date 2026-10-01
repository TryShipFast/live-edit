<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use ShipFast\LiveEdit\Support\OneAction;

/**
 * A batch id stopped being a uuid and the column did not hear about it.
 *
 * `uuid('batch')` is char(36). Undo on the service needs to know which site
 * and which token an action belonged to, so a batch became
 * "api:<site>:<token>:<uuid>" - 68 characters for a ten-letter site - and
 * every save through the API failed with "1406 Data too long". Not the picture
 * endpoint: every save, on every cloud site, text included.
 *
 * It passed 746 tests because they run on SQLite, which does not record a
 * varchar's length at all. The table it creates says `"batch" varchar not
 * null`, with no size anywhere, so everything fits and always will. The
 * register already has an entry about running migrations against MySQL, from a
 * deploy that failed twice. This was the third time.
 *
 * The width comes from OneAction::FITS rather than a literal, so the column
 * and the thing written to it cannot drift apart again.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('edit_revisions')) {
            return;
        }

        Schema::table('edit_revisions', function (Blueprint $table) {
            $table->string('batch', OneAction::FITS)->change();
        });
    }

    public function down(): void
    {
        // Deliberately not narrowed again. Rows written since this ran are
        // longer than 36 characters, and putting the old type back would
        // truncate a customer's history rather than fail.
    }
};
