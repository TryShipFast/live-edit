<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A host that ran this table's migration before the package shipped
        // one already has it; creating it again stops the whole migration.
        if (Schema::hasTable('edit_revisions')) {
            return;
        }

        Schema::create('edit_revisions', function (Blueprint $table) {
            $table->id();
            $table->uuid('batch');
            $table->string('action');
            $table->string('subject');
            $table->json('payload')->nullable();
            $table->timestamps();
            $table->index('batch');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('edit_revisions');
    }
};
