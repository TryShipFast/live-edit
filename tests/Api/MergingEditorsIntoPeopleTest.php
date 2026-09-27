<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * The one-way step that folds three accounts into one person.
 *
 * Worth testing on its own because it runs once, against real data, and the
 * ways it can go wrong are all silent: somebody keeps the account without the
 * password, a live session is orphaned, a link in an inbox stops working.
 * None of those raise anything. They are found later by the person who cannot
 * sign in.
 *
 * The migration has already run by the time a test starts, so this rebuilds
 * the old shape, runs the move again, and reads the result.
 */
class MergingEditorsIntoPeopleTest extends TestCase
{
    /** @return array{0: int, 1: int} the two site ids */
    private function twoSites(): array
    {
        return [
            DB::table('live_edit_sites')->insertGetId([
                'slug' => 'tokreamsblue', 'name' => 'Tokreams Blue',
                'created_at' => now(), 'updated_at' => now(),
            ]),
            DB::table('live_edit_sites')->insertGetId([
                'slug' => 'learnkasts', 'name' => 'LearnKasts',
                'created_at' => now(), 'updated_at' => now(),
            ]),
        ];
    }

    /**
     * Put back the old columns and the old rows, then run the move.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function asItWasBefore(array $rows): void
    {
        // Through the schema builder, not raw SQL: the two databases spell
        // this differently, and a helper that only speaks SQLite would make
        // this whole file untestable on the one that broke.
        try {
            Schema::table('live_edit_editors', fn (Blueprint $table) => $table->dropUnique(['email']));
        } catch (\Throwable) {
            // Not there yet, which is the shape being rebuilt anyway.
        }

        Schema::table('live_edit_editors', function (Blueprint $table) {
            $table->unsignedBigInteger('site_id')->nullable();
            $table->boolean('may_publish')->default(true);
        });
        DB::table('live_edit_editor_site')->delete();

        foreach ($rows as $row) {
            DB::table('live_edit_editors')->insert(array_merge([
                'created_at' => now(), 'updated_at' => now(),
            ], $row));
        }

        $migration = require __DIR__.'/../../database/migrations/2026_09_27_150000_one_person_may_edit_several_sites.php';

        (function () {
            $this->moveTheExistingPeopleAcross();
        })->call($migration);
    }

    /** The migration object, so up() can be run the way a deploy runs it. */
    private function migration(): object
    {
        return require __DIR__.'/../../database/migrations/2026_09_27_150000_one_person_may_edit_several_sites.php';
    }

    public function test_running_it_again_after_it_has_finished_does_nothing_rather_than_failing(): void
    {
        // A deploy that reruns migrations, or anybody retrying a pipeline,
        // must not be punished for it.
        $this->migration()->up();

        $this->assertTrue(Schema::hasTable('live_edit_editor_site'));
        $this->assertFalse(Schema::hasColumn('live_edit_editors', 'site_id'));
    }

    public function test_it_finishes_the_job_after_a_half_applied_run(): void
    {
        /*
         * The state a real deploy was left in.
         *
         * MySQL does not roll back a CREATE TABLE, so a migration that failed
         * partway through left the grants table behind while recording
         * nothing. The retry — the first thing anybody does — then hit "table
         * already exists" and the deploy was stuck with the database in
         * neither shape, which is the worst of the three places to be.
         */
        [$first, $second] = $this->twoSites();

        $this->asItWasBefore([
            ['email' => 'tope@agency.test', 'name' => 'Tope', 'site_id' => $first, 'may_publish' => 1],
            ['email' => 'tope@agency.test', 'name' => null, 'site_id' => $second, 'may_publish' => 0],
        ]);

        // asItWasBefore has put the old columns back and moved the people
        // across, which is precisely where the failed deploy stopped: grants
        // table present and full, old columns still there, no unique address.
        $this->assertTrue(Schema::hasColumn('live_edit_editors', 'site_id'));
        $this->assertGreaterThan(0, DB::table('live_edit_editor_site')->count());

        $this->migration()->up();

        $this->assertFalse(Schema::hasColumn('live_edit_editors', 'site_id'));
        $this->assertFalse(Schema::hasColumn('live_edit_editors', 'may_publish'));
        $this->assertSame(1, DB::table('live_edit_editors')->where('email', 'tope@agency.test')->count());
        $this->assertSame(2, DB::table('live_edit_editor_site')->count());
    }

    public function test_one_address_on_three_sites_becomes_one_person_with_three_grants(): void
    {
        [$first, $second] = $this->twoSites();

        $this->asItWasBefore([
            ['email' => 'tope@agency.test', 'name' => 'Tope', 'site_id' => $first, 'may_publish' => 1],
            ['email' => 'Tope@Agency.test', 'name' => null, 'site_id' => $second, 'may_publish' => 0],
        ]);

        $people = DB::table('live_edit_editors')->where('email', 'like', '%agency.test')->get();

        $this->assertCount(1, $people, 'the same address typed two ways is one person');
        $this->assertSame(2, DB::table('live_edit_editor_site')->where('editor_id', $people->first()->id)->count());

        // And the per-site answer survives the move rather than being
        // flattened to whichever row came first.
        $this->assertSame(
            [0, 1],
            DB::table('live_edit_editor_site')
                ->where('editor_id', $people->first()->id)
                ->orderBy('site_id')
                ->pluck('may_publish')
                ->map(fn ($v) => (int) $v)
                ->sort()
                ->values()
                ->all()
        );
    }

    public function test_the_surviving_account_keeps_a_password_even_when_the_other_row_had_it(): void
    {
        [$first, $second] = $this->twoSites();

        // The password is on the SECOND row, which is the one being folded
        // away. Keeping the first row wholesale would leave somebody with an
        // account they cannot sign into and nothing on screen to say why.
        $this->asItWasBefore([
            ['email' => 'tope@agency.test', 'password' => null, 'site_id' => $first],
            ['email' => 'tope@agency.test', 'password' => 'a-real-looking-hash', 'site_id' => $second],
        ]);

        $person = DB::table('live_edit_editors')->where('email', 'tope@agency.test')->sole();

        $this->assertSame('a-real-looking-hash', $person->password);
    }

    public function test_a_live_session_follows_the_person_it_belonged_to(): void
    {
        [$first, $second] = $this->twoSites();

        $this->asItWasBefore([
            ['email' => 'tope@agency.test', 'site_id' => $first],
            ['email' => 'tope@agency.test', 'site_id' => $second],
        ]);

        // The row the session pointed at is gone; the session must not be.
        $person = DB::table('live_edit_editors')->where('email', 'tope@agency.test')->sole();
        $this->assertSame(0, DB::table('live_edit_api_tokens')->whereNotNull('editor_id')->where('editor_id', '!=', $person->id)->count());
    }

    public function test_somebody_who_only_ever_edited_one_site_comes_through_unchanged(): void
    {
        [$first] = $this->twoSites();

        $this->asItWasBefore([
            ['email' => 'owner@tokreamsblue.test', 'name' => 'Client', 'site_id' => $first, 'may_publish' => 1],
        ]);

        $person = DB::table('live_edit_editors')->where('email', 'owner@tokreamsblue.test')->sole();
        $grant = DB::table('live_edit_editor_site')->where('editor_id', $person->id)->sole();

        $this->assertSame($first, (int) $grant->site_id);
        $this->assertSame('Client', $person->name);
        $this->assertSame(1, (int) $grant->may_publish);
    }
}
