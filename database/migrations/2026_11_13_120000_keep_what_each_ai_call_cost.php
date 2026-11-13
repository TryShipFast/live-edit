<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * What every paid call to an AI provider really cost (owner, 13 Nov 2026: "please fix the real cost ... we need to be
 * sure of the prices since image is not same as text"). One row a call, kept also when the work was refunded to the
 * customer: the provider was still paid. Credit prices are set from these, per kind of work.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('live_edit_ai_costs')) {
            return;
        }

        Schema::create('live_edit_ai_costs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('site_id')->nullable()->index();
            // chat, picture, rewrite, shorten, voice
            $table->string('kind', 32)->index();
            $table->string('model', 80);
            // what the provider counted: tokens, images, seconds
            $table->json('usage')->nullable();
            $table->decimal('cost_usd', 12, 6);
            $table->timestamps();
            $table->index(['kind', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_ai_costs');
    }
};
