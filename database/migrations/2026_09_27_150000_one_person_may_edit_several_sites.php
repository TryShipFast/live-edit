<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * An editor is a person, not a person-on-one-site.
 *
 * Until now the row WAS the pairing: the same address on three sites was
 * three records, three passwords, three sign-ins. That is fine for a company
 * editing its own website and wrong for everybody else, because the people
 * who edit sites for a living edit several. An agency looking after thirty
 * clients had thirty separate accounts for one person, each with its own
 * password to forget, and changing one changed nothing about the others.
 *
 * So the person moves out and the grant stays behind. live_edit_editors holds
 * who somebody is, once, keyed by address. live_edit_editor_site holds what
 * they may do on one site, which is where may_publish belongs: trusting
 * somebody to publish on your marketing page says nothing about your
 * client's.
 *
 * A SESSION IS STILL FOR ONE SITE. Nothing here changes that and it is the
 * point worth being careful about: one login is a convenience, one credential
 * that works everywhere is a much larger thing to lose.
 *
 * The merge below is the awkward part and the reason this is written out
 * rather than expressed in two schema calls. Rows that are about to become
 * one person have to be reconciled first — which password survives, which
 * sessions follow whom — and getting that wrong locks somebody out of their
 * own work.
 */
return new class extends Migration
{
    /*
     * EVERY STEP BELOW ASKS BEFORE IT ACTS.
     *
     * MySQL does not roll back a CREATE TABLE. A migration that fails halfway
     * therefore leaves the work it had already done in place while recording
     * nothing, so the retry — which is the first thing anybody does — hits
     * "table already exists" and the deploy is stuck with the database in
     * neither shape. Asking first costs a handful of catalogue reads once and
     * turns the retry into the fix.
     */
    public function up(): void
    {
        if (! Schema::hasTable('live_edit_editor_site')) {
            $this->createTheGrants();
        }

        if (! Schema::hasColumn('live_edit_sign_in_tokens', 'site_id')) {
            /*
             * A sign-in link has to name its own site now.
             *
             * It used to read the site off the editor, which worked only
             * while an editor was a person-on-one-site. With one account
             * spanning several, a link redeemed from a mailbox would land the
             * person on whichever site came back first.
             */
            Schema::table('live_edit_sign_in_tokens', function (Blueprint $table) {
                $table->foreignId('site_id')->nullable()->after('editor_id')
                    ->constrained('live_edit_sites')->cascadeOnDelete();
            });
        }

        // The presence of this column is what says the move has not happened.
        if (Schema::hasColumn('live_edit_editors', 'site_id')) {
            $this->moveTheExistingPeopleAcross();
            $this->retireTheOldColumns();
        }

        if (! $this->hasIndex('live_edit_editors', 'live_edit_editors_email_unique')) {
            // Added after the merge, never before: the merge is what makes it
            // true, and a site with two rows for one address would fail here
            // with nothing explaining why.
            Schema::table('live_edit_editors', function (Blueprint $table) {
                $table->unique('email');
            });
        }
    }

    private function createTheGrants(): void
    {
        Schema::create('live_edit_editor_site', function (Blueprint $table) {
            $table->id();
            $table->foreignId('editor_id')->constrained('live_edit_editors')->cascadeOnDelete();
            $table->foreignId('site_id')->constrained('live_edit_sites')->cascadeOnDelete();
            $table->boolean('may_publish')->default(true);

            // Per site, not per person. "Tope last edited four minutes ago"
            // is only useful on the page of the site they edited.
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['editor_id', 'site_id']);
        });
    }

    /**
     * Take away the columns that said an editor belonged to one site.
     *
     * Three separate statements, in this order, because the two databases
     * this has to run on disagree about what is in the way.
     *
     * MySQL will not drop an index a foreign key is relying on, and site_id's
     * foreign key was relying on the composite unique — so the constraint has
     * to go first or the whole migration stops with errno 150, which is
     * exactly what happened on the first deploy that was not SQLite.
     *
     * SQLite has no such objection but rebuilds the table to drop a column
     * and refuses while an index still names the one going away, so the
     * unique has to go before the column. Doing each in its own call is what
     * satisfies both.
     */
    private function retireTheOldColumns(): void
    {
        $this->quietly(fn () => Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->dropForeign(['site_id']);
        }));

        $this->quietly(fn () => Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->dropUnique(['site_id', 'email']);
        }));

        Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->dropColumn(['site_id', 'may_publish']);
        });
    }

    /**
     * Run something that only has to succeed if it was there to begin with.
     *
     * Used for dropping a constraint and an index. Whether either exists
     * depends on how old the database is and which driver made it, and a
     * migration that dies because it could not remove something that was
     * already absent has failed at doing nothing.
     */
    private function quietly(callable $step): void
    {
        try {
            $step();
        } catch (Throwable) {
            // Already gone, which is the state this was trying to reach.
        }
    }

    private function hasIndex(string $table, string $name): bool
    {
        try {
            foreach (Schema::getIndexes($table) as $index) {
                if (($index['name'] ?? '') === $name) {
                    return true;
                }
            }
        } catch (Throwable) {
            return false;
        }

        return false;
    }

    /**
     * Turn every existing row into a person and a grant.
     *
     * Keyed on the address in lower case, because that is how sign-in already
     * compares them: somebody who registered as Tope@acme.com on one site and
     * tope@acme.com on another has always been one person to the login form,
     * and splitting them here would make that a lie.
     */
    private function moveTheExistingPeopleAcross(): void
    {
        $rows = DB::table('live_edit_editors')->orderBy('id')->get();
        $keepers = [];
        $retired = [];

        foreach ($rows as $row) {
            $address = mb_strtolower(trim((string) $row->email));
            $keeper = $keepers[$address] ?? null;

            if ($keeper === null) {
                $keepers[$address] = $row;
                $keeper = $row;
            } elseif ($keeper->id !== $row->id) {
                $retired[$row->id] = $keeper->id;

                /*
                 * Keep a password rather than the first row.
                 *
                 * The duplicate being folded away may be the only one they
                 * ever set a password on. Dropping it silently would leave
                 * somebody with an account they cannot sign into and no way
                 * to tell that anything had happened.
                 */
                if (blank($keeper->password ?? null) && filled($row->password ?? null)) {
                    DB::table('live_edit_editors')
                        ->where('id', $keeper->id)
                        ->update(['password' => $row->password]);
                }

                if (blank($keeper->name ?? null) && filled($row->name ?? null)) {
                    DB::table('live_edit_editors')->where('id', $keeper->id)->update(['name' => $row->name]);
                }
            }

            if ($row->site_id === null) {
                continue;
            }

            DB::table('live_edit_editor_site')->insertOrIgnore([
                'editor_id' => $keeper->id,
                'site_id' => $row->site_id,
                'may_publish' => $row->may_publish ?? true,
                'last_seen_at' => $row->last_seen_at ?? null,
                'created_at' => $row->created_at ?? now(),
                'updated_at' => now(),
            ]);
        }

        // Links already in somebody's inbox keep working: their site is the
        // one their person had when the link was made. Done here, while the
        // editors still have a site_id to read.
        DB::table('live_edit_sign_in_tokens')->whereNull('site_id')->orderBy('id')->each(function ($link) {
            $siteId = DB::table('live_edit_editors')->where('id', $link->editor_id)->value('site_id');

            if ($siteId !== null) {
                DB::table('live_edit_sign_in_tokens')->where('id', $link->id)->update(['site_id' => $siteId]);
            }
        });

        // Anything pointing at a row that is about to disappear is pointed at
        // the survivor instead. Skipping this would end a live session and
        // kill an unclicked sign-in link for no reason the person could see.
        foreach ($retired as $was => $now) {
            foreach (['live_edit_api_tokens', 'live_edit_sign_in_tokens'] as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->where('editor_id', $was)->update(['editor_id' => $now]);
                }
            }
        }

        if ($retired !== []) {
            DB::table('live_edit_editors')->whereIn('id', array_keys($retired))->delete();
        }
    }

    public function down(): void
    {
        Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->foreignId('site_id')->nullable()->constrained('live_edit_sites')->cascadeOnDelete();
            $table->boolean('may_publish')->default(true);
        });

        // One site each on the way back, which is all the old shape could
        // hold. The people who edit several keep the first.
        foreach (DB::table('live_edit_editor_site')->orderBy('id')->get() as $grant) {
            DB::table('live_edit_editors')
                ->where('id', $grant->editor_id)
                ->whereNull('site_id')
                ->update([
                    'site_id' => $grant->site_id,
                    'may_publish' => $grant->may_publish,
                    'last_seen_at' => $grant->last_seen_at,
                ]);
        }

        Schema::table('live_edit_sign_in_tokens', function (Blueprint $table) {
            $table->dropConstrainedForeignId('site_id');
        });

        Schema::dropIfExists('live_edit_editor_site');
    }
};
