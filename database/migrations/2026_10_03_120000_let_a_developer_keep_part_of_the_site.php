<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who may edit the parts the page's author locked.
 *
 * A developer hands over a site with their name on it. They will forgive a
 * rough install; they will not forgive a client breaking the navigation. The
 * markup says which parts are theirs - data-live-lock on a nav, a footer, a
 * pricing table - and this says who that binds.
 *
 * Defaults to true, which keeps every editor who exists today exactly as they
 * are. Nobody has locked anything yet, so there is nothing to withhold, and a
 * column that quietly took access away from somebody mid-project would be a
 * worse first impression than not shipping it.
 *
 * The console turns it off for an invited editor. It sits beside may_publish
 * because it is the same kind of fact: what this person, on this site, is
 * allowed to do.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('live_edit_editor_site')) {
            return;
        }

        Schema::table('live_edit_editor_site', function (Blueprint $table) {
            $table->boolean('may_edit_locked')->default(true)->after('may_publish');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('live_edit_editor_site')) {
            return;
        }

        Schema::table('live_edit_editor_site', function (Blueprint $table) {
            $table->dropColumn('may_edit_locked');
        });
    }
};
