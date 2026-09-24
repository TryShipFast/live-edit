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
        if (Schema::hasTable('element_styles')) {
            return;
        }

        Schema::create('element_styles', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('props');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('element_styles');
    }
};
