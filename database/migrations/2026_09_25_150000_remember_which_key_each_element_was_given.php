<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What each element on a page was last called.
 *
 * A site we tag while it loads has no previous file to compare against. When
 * the scanner improves — as it just did, and will again — the same element can
 * be handed a different name, and everything stored under the old one is
 * orphaned: the page quietly goes back to the theme's words and the client's
 * work looks lost. That is the failure this whole product exists to avoid, so
 * causing it by improving the scanner would be the worst way to lose a
 * customer.
 *
 * Remembering the last set of names makes a re-tag recoverable: an element is
 * recognisable by what the theme put in it, which a re-tag never changes, so
 * its content can follow it to whatever it is called now.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_key_maps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            // One page of one site. A site's pages are tagged separately and
            // keep their own names.
            $table->string('page')->default('');
            // So an unchanged page costs a read and a comparison rather than a
            // write on every visit.
            $table->string('fingerprint', 64);
            $table->json('map');
            $table->timestamps();

            $table->unique(['site_id', 'page']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_key_maps');
    }
};
