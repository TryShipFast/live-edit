<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which languages a site is in, decided by that site.
 *
 * Every part of translation read `config('live-edit.locales')`, which is one
 * list per installation. On a self-hosted Laravel or WordPress site that is
 * exactly right: one install, one site, one list somebody edits in a file.
 *
 * On the service it is wrong twice over. Every customer would share one list,
 * so a site in English and Swahili would be offered French because another
 * customer runs French - and no customer could choose their own languages at
 * all without us editing a config file on their behalf. The feature could not
 * ship to the product it was built for.
 *
 * Null means "use the installation's config", so every self-hosted install
 * behaves exactly as it did and nothing has to be filled in to upgrade.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            // Code to name: {"en":"English","fr":"French"}. The name travels
            // with the choice so a menu reads "French" rather than "FR", and
            // so the customer decides what their own languages are called.
            $table->json('locales')->nullable();
            // Which of them the words are written in. Everything else is a
            // translation of this one.
            $table->string('default_locale', 12)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_sites', function (Blueprint $table) {
            $table->dropColumn(['locales', 'default_locale']);
        });
    }
};
