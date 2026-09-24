<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A publishable key is not a secret, and pretending otherwise cost something.
 *
 * Every key was stored only as a hash, which is right for the two that matter:
 * a leaked database should not hand anyone a working secret or session. But a
 * publishable key is printed into every page of the site it belongs to. Hashing
 * it protects nothing and made it impossible to tell a site what its own key
 * is — so a customer had to paste it into their HTML by hand, and rotating one
 * meant asking them to edit their site.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_api_tokens', function (Blueprint $table) {
            // Only ever filled for publishable keys. Secrets and sessions stay
            // hashed and unrecoverable.
            $table->string('public_text')->nullable()->after('secret_hash');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_api_tokens', function (Blueprint $table) {
            $table->dropColumn('public_text');
        });
    }
};
