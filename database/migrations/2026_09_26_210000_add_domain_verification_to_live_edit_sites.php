<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proof that the person who registered a site actually owns it.
 *
 * Until now a site's domain was self-declared: `allowed_origins` is whatever
 * the registrant typed, and the origin policy is honest in its own docblock
 * that it is a blast radius rather than authentication — a request arriving
 * with no Origin header at all is let through to the key check, because a
 * server is not a browser and CORS has nothing to say about it.
 *
 * That combination means a key lifted from a page's source works from anywhere
 * that is not a browser, against a domain nobody ever proved they held. The
 * columns below are what turn "the domain this site claims" into "the domain
 * this site demonstrated it controls", so a licence can be tied to it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            // The one canonical hostname a licence is good for, stored bare
            // ("example.com") rather than as an origin: a licence follows the
            // site, not the scheme or the port it happens to be served on.
            $table->string('domain')->nullable()->after('name');

            // Generated at registration and never shown again once verified.
            // Kept afterwards so re-verification does not need a new code and
            // a customer's DNS record or file can stay where they put it.
            $table->string('verification_code', 64)->nullable()->after('domain');

            $table->timestamp('verified_at')->nullable()->after('verification_code');

            // Not unique: a domain may be re-registered after a site is
            // deleted, and two unverified rows may honestly claim the same
            // name while only one of them can ever prove it.
            $table->index('domain');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->dropIndex(['domain']);
            $table->dropColumn(['domain', 'verification_code', 'verified_at']);
        });
    }
};
