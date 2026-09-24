<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The people allowed to edit a site, when nobody else can say who they are.
 *
 * Every other adapter borrows an existing answer: Laravel has users, WordPress
 * has users, a Next app has whatever its owner built. A folder of HTML on a CDN
 * has none, so either its owner writes a small service of their own — which a
 * dentist will not — or this service knows them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_editors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->string('email');
            $table->string('name')->nullable();
            // Whether this person may put changes in front of the public, as
            // opposed to only proposing them.
            $table->boolean('may_publish')->default(true);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            // One person per site. The same address on two sites is two
            // people as far as this is concerned.
            $table->unique(['site_id', 'email']);
        });

        Schema::create('live_edit_sign_in_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('editor_id')->constrained('live_edit_editors')->cascadeOnDelete();
            // Only ever a hash. A link in an inbox is a credential, and a
            // leaked table should not hand anyone a working one.
            $table->string('token_hash', 64)->unique();
            // Where to send them afterwards, checked against the site's own
            // origins when it is issued — never trusted from the click.
            $table->string('return_to', 500);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_sign_in_tokens');
        Schema::dropIfExists('live_edit_editors');
    }
};
