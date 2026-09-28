<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Which pages somebody has actually opened for editing.
 *
 * Needed because a plan can cover a number of them, and a limit with nothing
 * to count is not a limit. The obvious place to count was live_edit_key_maps,
 * which already holds one row per site and page, but that is a cache: written
 * best-effort inside a rescue during tagging, and clearing it would hand
 * somebody a fresh allowance.
 *
 * Keyed by a scope string rather than by a site id, because this table has to
 * work in two places that do not look alike. On the service a scope is a
 * site's id, and there are thousands. On a customer's own Laravel install
 * there is no sites table to point at at all: that install tags its own pages
 * and knows itself only by the slug in its environment file. A foreign key
 * would have made this table service-only, and the limit would then have bound
 * WordPress and quietly not bound Laravel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_site_pages', function (Blueprint $table) {
            $table->id();

            // "1" on the service, "their-site-slug" on a customer's install.
            $table->string('scope', 120);

            // The path as the site calls it, normalised. Empty is the home
            // page, matching live_edit_key_maps rather than inventing a second
            // spelling for the same thing.
            $table->string('page', 200)->default('');

            // Which page was claimed first, when an allowance is smaller than
            // the site. Ordering by id would do it; saying so explicitly costs
            // one column and removes an assumption.
            $table->timestamp('first_edited_at')->nullable();
            $table->timestamp('last_edited_at')->nullable();

            $table->timestamps();

            $table->unique(['scope', 'page']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_site_pages');
    }
};
