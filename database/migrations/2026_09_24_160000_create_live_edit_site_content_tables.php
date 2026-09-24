<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Content that belongs to a site rather than to the installation.
 *
 * Until now an installation served one customer, so "the content" needed no
 * owner: it was whatever was in the host's own settings table. That works
 * exactly until the second customer, at which point one site's key reads the
 * other's words.
 *
 * A bespoke site keeps using its own models, because the whole point of those
 * is that they are the customer's own shape. These tables are for sites served
 * over the API, where this installation holds the content on their behalf.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_site_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();

            // One value per key per site. The same key on two sites is two
            // different things and must never collide.
            $table->unique(['site_id', 'key']);
        });

        Schema::create('live_edit_site_styles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->string('key');
            $table->json('props');
            $table->timestamps();

            $table->unique(['site_id', 'key']);
        });

        Schema::table('live_edit_drafts', function (Blueprint $table) {
            // Null means the installation's own content — the bespoke path,
            // which had no notion of a site and should not gain one.
            $table->foreignId('site_id')->nullable()->after('id')
                ->constrained('live_edit_sites')->cascadeOnDelete();
        });

        Schema::table('live_edit_drafts', function (Blueprint $table) {
            $table->dropUnique(['kind', 'subject']);
            $table->unique(['site_id', 'kind', 'subject']);
        });

        Schema::table('live_edit_versions', function (Blueprint $table) {
            $table->foreignId('site_id')->nullable()->after('id')
                ->constrained('live_edit_sites')->cascadeOnDelete();
        });

        Schema::table('live_edit_versions', function (Blueprint $table) {
            // Version numbers count per site, so two sites both have a v1.
            $table->dropUnique(['number']);
            $table->unique(['site_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_versions', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'number']);
            $table->dropConstrainedForeignId('site_id');
            $table->unique('number');
        });

        Schema::table('live_edit_drafts', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'kind', 'subject']);
            $table->dropConstrainedForeignId('site_id');
            $table->unique(['kind', 'subject']);
        });

        Schema::dropIfExists('live_edit_site_styles');
        Schema::dropIfExists('live_edit_site_settings');
    }
};
