<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_site_usage', function (Blueprint $table) {
            // Tagging a page the customer never prepared costs a full parse,
            // so it is billable in its own right.
            $table->unsignedBigInteger('tags')->default(0)->after('uploads');
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_site_usage', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
    }
};
