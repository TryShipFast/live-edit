<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which person a session token was issued to.
 *
 * The token already carried a name, but as a label for a human reading a list
 * of keys — "Tope", or an address when we had no name. Identifying somebody by
 * it means two editors called Tope are one editor, and a rename silently
 * becomes a different person.
 *
 * A site that keeps its own content now asks us who is holding a session, so
 * that it can say "Welcome Tope" and know it is addressing the right one. That
 * answer has to come from a row, not from a display string.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('live_edit_api_tokens', function (Blueprint $table) {
            // Nullable because only sessions have a person behind them: the
            // publishable and secret keys belong to the site itself.
            $table->foreignId('editor_id')->nullable()->after('site_id')
                ->constrained('live_edit_editors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('live_edit_api_tokens', function (Blueprint $table) {
            $table->dropConstrainedForeignId('editor_id');
        });
    }
};
