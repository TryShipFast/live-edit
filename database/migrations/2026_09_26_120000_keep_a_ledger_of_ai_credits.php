<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every credit a site is given and every credit it spends.
 *
 * A ledger rather than a balance column, because a balance alone cannot answer
 * the question somebody actually asks: "where did my credits go?" A number
 * that went down and cannot say why is indistinguishable from a number that
 * went down for no reason, and the person asking has paid for it.
 *
 * It also makes the balance impossible to lose. A column is one write away
 * from being wrong forever; a sum of rows can be recomputed from what
 * happened.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('live_edit_credit_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();

            // Positive for a grant or a purchase, negative for a spend. One
            // signed column rather than two, so the balance is a sum and there
            // is no way to write a row that means nothing.
            $table->integer('delta');

            // What it was for, in the vocabulary the product uses: rewrite,
            // shorten, translate_block, generate_image, translate_page,
            // purchase, signup_grant.
            $table->string('reason', 40);

            // Enough to recognise the entry on a statement: which element,
            // which page, which language.
            $table->json('meta')->nullable();

            $table->timestamps();

            // The only query there is: everything for one site, newest first.
            $table->index(['site_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_credit_entries');
    }
};
