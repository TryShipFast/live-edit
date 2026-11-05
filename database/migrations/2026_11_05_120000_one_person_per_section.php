<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Team editing: one person per section.
 *
 * Owner, 5 Nov 2026: "if we allow for collaboration, we should lock a section
 * a team member is working on and publish releases it, otherwise, they
 * override eachother works".
 *
 * Before this a draft was one shared row per key and Publish put every row
 * live, so two people editing the same site silently overwrote each other and
 * whoever pressed Publish first published the other person's half-finished
 * work as well.
 *
 *   - live_edit_section_locks: who is working on which part of the site. One
 *     row per (site, unit), so two people can never hold the same part: the
 *     unique index is the referee, not a read-then-write.
 *   - drafts remember who wrote them and which part they belong to, so
 *     Publish can put live only the publisher's own work.
 *   - versions remember who published them and what each change was, so
 *     History can say "Ada changed the headline in Hero".
 *   - a session minted by a host can say who the person is, and a grant can
 *     say whether that person is the website's owner.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('live_edit_section_locks')) {
            Schema::create('live_edit_section_locks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
                // What is locked: "section:hero", "site/header", "panel:brand", "form:contact/x".
                $table->string('unit', 191);
                // What a person would call it: "Hero", "Brand".
                $table->string('label', 191)->nullable();
                // Who holds it: "e12" (an editor we know), "h:<ref>" (a person the host named).
                $table->string('holder', 120);
                $table->string('holder_name', 120)->nullable();
                $table->string('holder_role', 20)->default('editor');
                $table->timestamp('claimed_at')->nullable();
                $table->timestamp('last_active_at')->nullable();
                // Set when the owner takes a lock over, so the person who had
                // it is told on their next action.
                $table->string('taken_from', 120)->nullable();
                $table->string('taken_from_name', 120)->nullable();
                $table->timestamps();

                $table->unique(['site_id', 'unit']);
                $table->index(['site_id', 'holder']);
                $table->index(['site_id', 'taken_from']);
                $table->index('last_active_at');
            });
        }

        if (Schema::hasTable('live_edit_drafts') && ! Schema::hasColumn('live_edit_drafts', 'author')) {
            Schema::table('live_edit_drafts', function (Blueprint $table) {
                $table->string('author', 120)->nullable()->after('payload');
                $table->string('author_name', 120)->nullable()->after('author');
                $table->string('unit', 191)->nullable()->after('author_name');
                $table->string('unit_label', 191)->nullable()->after('unit');
                $table->index(['site_id', 'author']);
                $table->index(['site_id', 'unit']);
            });
        }

        if (Schema::hasTable('live_edit_versions') && ! Schema::hasColumn('live_edit_versions', 'summary')) {
            Schema::table('live_edit_versions', function (Blueprint $table) {
                $table->string('published_by_id', 120)->nullable();
                // [{unit, label, author, author_name, key, kind, what, before, after}]
                $table->json('summary')->nullable();
                $table->unsignedInteger('undoes')->nullable();
            });
        }

        if (Schema::hasTable('live_edit_api_tokens') && ! Schema::hasColumn('live_edit_api_tokens', 'holder_ref')) {
            Schema::table('live_edit_api_tokens', function (Blueprint $table) {
                $table->string('holder_ref', 100)->nullable();
                $table->string('holder_name', 120)->nullable();
                $table->string('holder_role', 20)->nullable();
            });
        }

        if (Schema::hasTable('live_edit_editor_site') && ! Schema::hasColumn('live_edit_editor_site', 'role')) {
            Schema::table('live_edit_editor_site', function (Blueprint $table) {
                $table->string('role', 20)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('live_edit_section_locks');

        if (Schema::hasColumn('live_edit_drafts', 'author')) {
            Schema::table('live_edit_drafts', function (Blueprint $table) {
                $table->dropIndex(['site_id', 'author']);
                $table->dropIndex(['site_id', 'unit']);
                $table->dropColumn(['author', 'author_name', 'unit', 'unit_label']);
            });
        }

        if (Schema::hasColumn('live_edit_versions', 'summary')) {
            Schema::table('live_edit_versions', function (Blueprint $table) {
                $table->dropColumn(['published_by_id', 'summary', 'undoes']);
            });
        }

        if (Schema::hasColumn('live_edit_api_tokens', 'holder_ref')) {
            Schema::table('live_edit_api_tokens', function (Blueprint $table) {
                $table->dropColumn(['holder_ref', 'holder_name', 'holder_role']);
            });
        }

        if (Schema::hasColumn('live_edit_editor_site', 'role')) {
            Schema::table('live_edit_editor_site', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
