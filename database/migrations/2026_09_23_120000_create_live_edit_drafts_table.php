<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Edits that have not gone live yet.
 *
 * Without this every change a client makes is published the instant it saves,
 * which is a poor thing to hand someone who is learning the editor on their own
 * site. A draft row shadows the published value: the editor and anyone holding
 * a preview link see it, visitors do not, until someone presses publish.
 */
return new class extends Migration
{
    public function up(): void
    {
        // A host that ran this table's migration before the package shipped
        // one already has it; creating it again stops the whole migration.
        if (Schema::hasTable('live_edit_drafts')) {
            return;
        }

        Schema::create('live_edit_drafts', function (Blueprint $table) {
            $table->id();
            // 'setting' or 'style': what the subject names.
            $table->string('kind', 20);
            $table->string('subject');
            $table->json('payload');
            $table->timestamps();

            $table->unique(['kind', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_drafts');
    }
};
