<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the English said when this translation was written.
 *
 * Without it, a site with six languages could have its English edited and go
 * on serving six translations of the sentence that used to be there. The save
 * succeeded, the editor said so, and nothing knew the other five languages
 * were now wrong. A site looks finished and is wrong in languages nobody on
 * the team reads.
 *
 * A fingerprint of the canonical value rather than a version number, so that
 * editing the English and undoing it leaves every translation current - which
 * is true, and which a counter gets wrong forever. Null on canonical rows, and
 * null on translations written before this existed: unknown is not the same as
 * stale, and marking a whole site for review on the day this ships is how a
 * warning learns to be ignored.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_site_settings', function (Blueprint $table) {
            $table->string('translated_from', 32)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_site_settings', function (Blueprint $table) {
            $table->dropColumn('translated_from');
        });
    }
};
