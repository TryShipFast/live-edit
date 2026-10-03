<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A session minted by somebody else's server, and what it may touch.
 *
 * Our own sessions have a person behind them, so what they may edit is a fact
 * about that person and lives on the pivot. A session a HOST mints has nobody:
 * WordPress knows which of its users is at the keyboard and we do not, which
 * is the whole reason minting exists.
 *
 * Without this the lock simply did not bind on WordPress - every session it
 * minted looked like the site asking about itself, and the site may edit all
 * of itself. The guardrail was present, documented, and absent on the platform
 * most likely to need it.
 *
 * So the host says at mint time. It is the only moment anybody knows.
 *
 * Defaults to true, which is what every session minted before today meant.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('live_edit_api_tokens')) {
            return;
        }

        Schema::table('live_edit_api_tokens', function (Blueprint $table) {
            $table->boolean('may_edit_locked')->default(true)->after('editor_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('live_edit_api_tokens')) {
            return;
        }

        Schema::table('live_edit_api_tokens', function (Blueprint $table) {
            $table->dropColumn('may_edit_locked');
        });
    }
};
