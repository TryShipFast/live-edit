<?php

namespace ShipFast\LiveEdit\Tests\Api;

use Illuminate\Support\Facades\DB;
use ShipFast\LiveEdit\Application\Api\IssueEditSession;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Editor;
use ShipFast\LiveEdit\Domain\Site\EditorSession;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Domain\Team\LockRefused;
use ShipFast\LiveEdit\Domain\Team\Person;
use ShipFast\LiveEdit\Domain\Team\SectionLocks;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SectionLock;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Models\Version;
use ShipFast\LiveEdit\Tests\TestCase;

/**
 * Team editing: one person per section.
 *
 * Owner, 5 Nov 2026: "if we allow for collaboration, we should lock a section
 * a team member is working on and publish releases it, otherwise, they
 * override eachother works".
 */
class TeamEditingTest extends TestCase
{
    protected Site $site;

    protected string $ada;

    protected string $tunde;

    protected string $owner;

    protected string $website;

    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        $app['config']->set('live-edit.api', [
            'enabled' => true,
            'prefix' => 'api/live-edit/v1',
            'session_ttl' => 7200,
            'throttle' => [
                'read' => ['burst' => ['max' => 1000, 'seconds' => 60], 'sustained' => ['max' => 30000, 'seconds' => 3600]],
                'write' => ['burst' => ['max' => 1000, 'seconds' => 60], 'sustained' => ['max' => 30000, 'seconds' => 3600]],
                'session' => ['burst' => ['max' => 100, 'seconds' => 60], 'sustained' => ['max' => 1200, 'seconds' => 3600]],
                'publish' => ['burst' => ['max' => 100, 'seconds' => 60], 'sustained' => ['max' => 600, 'seconds' => 3600]],
            ],
            'cache' => ['pointer_seconds' => 30, 'version_seconds' => 31536000, 'stale_while_revalidate' => 86400],
        ]);
        $app['config']->set('live-edit.publishing', true);
        $app['config']->set('live-edit.settings', ['hero.title', 'story.body', 'loose.key']);
        $app['config']->set('cors.paths', []);
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->site = Site::query()->create(['slug' => 'team', 'name' => 'Team', 'allowed_origins' => ['https://team.test']]);

        $issue = app(IssueEditSession::class);
        $this->ada = $issue($this->site, 'Ada', null, true, ['id' => 'u1', 'name' => 'Ada', 'role' => 'editor'])['token'];
        $this->tunde = $issue($this->site, 'Tunde', null, true, ['id' => 'u2', 'name' => 'Tunde', 'role' => 'editor'])['token'];
        $this->owner = $issue($this->site, 'Olu', null, true, ['id' => 'u0', 'name' => 'Olu', 'role' => 'owner'])['token'];
        [, $this->website] = $this->site->issueToken(TokenType::Session, 'Edit', [Ability::Read, Ability::Write, Ability::Publish], now()->addHour());

        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => 'hero.title', 'value' => 'Welcome']);
        SiteSetting::query()->create(['site_id' => $this->site->id, 'key' => 'story.body', 'value' => 'Our story']);
    }

    protected function url(string $path): string
    {
        return '/api/live-edit/v1/team'.$path;
    }

    protected function headers(string $token, array $more = []): array
    {
        return array_merge(['Authorization' => 'Bearer '.$token, 'Origin' => 'https://team.test'], $more);
    }

    protected function save(string $token, string $key, string $value, ?string $unit = null, ?string $label = null)
    {
        return $this->postJson($this->url('/content'), ['key' => $key, 'value' => $value], $this->headers($token, array_filter([
            'X-Live-Edit-Unit' => $unit,
            'X-Live-Edit-Unit-Label' => $label,
            'X-Live-Edit-What' => 'the headline',
        ])));
    }

    protected function live(string $key): ?string
    {
        return SiteSetting::query()->where('site_id', $this->site->id)->where('key', $key)->value('value');
    }

    public function test_the_first_edit_claims_the_section_and_a_teammate_is_refused_in_plain_words(): void
    {
        $this->save($this->ada, 'hero.title', 'Hello from Ada', 'section:home.hero', 'Hero')->assertOk();

        $lock = SectionLock::query()->where('site_id', $this->site->id)->where('unit', 'section:home.hero')->first();
        $this->assertSame('h:u1', $lock->holder);
        $this->assertSame('Ada', $lock->holder_name);

        $refused = $this->save($this->tunde, 'hero.title', 'Tunde was here', 'section:home.hero', 'Hero');
        $refused->assertStatus(409)
            ->assertJsonPath('error.type', 'section_locked')
            ->assertJsonPath('error.lock.name', 'Ada')
            ->assertJsonPath('error.message', 'Ada is editing Hero right now. Ask an admin to take over if it cannot wait.');

        $this->assertStringNotContainsString("\u{2014}", $refused->json('error.message'));
        $this->assertSame('Hello from Ada', Draft::query()->where('subject', 'hero.title')->first()->payload['value']);
    }

    public function test_a_stale_browser_that_declares_no_section_still_meets_the_lock(): void
    {
        $this->save($this->ada, 'hero.title', 'Hello from Ada', 'section:home.hero', 'Hero')->assertOk();

        // No unit header at all, and a wrong one: the draft remembers its section.
        $this->save($this->tunde, 'hero.title', 'Sneaky')->assertStatus(409);
        $this->save($this->tunde, 'hero.title', 'Sneaky', 'section:home.story')->assertStatus(409);

        $this->assertSame('Hello from Ada', Draft::query()->where('subject', 'hero.title')->first()->payload['value']);
    }

    public function test_two_first_edits_at_once_give_the_section_to_one_and_refuse_the_other_cleanly(): void
    {
        $locks = new SectionLocks($this->site);
        $ada = new Person('h:u1', 'Ada', 'editor');
        $tunde = new Person('h:u2', 'Tunde', 'editor');

        // Both inserts race on the unique (site, unit) index: one row wins.
        $first = SectionLock::query()->insertOrIgnore(['site_id' => $this->site->id, 'unit' => 'section:x', 'holder' => 'h:u1', 'holder_name' => 'Ada', 'holder_role' => 'editor', 'claimed_at' => now(), 'last_active_at' => now()]);
        $second = SectionLock::query()->insertOrIgnore(['site_id' => $this->site->id, 'unit' => 'section:x', 'holder' => 'h:u2', 'holder_name' => 'Tunde', 'holder_role' => 'editor', 'claimed_at' => now(), 'last_active_at' => now()]);
        $this->assertSame([1, 0], [$first, $second]);

        // And through the service: the loser gets a clean refusal naming the winner.
        $locks->claim($ada, 'section:y', 'Story');

        try {
            $locks->claim($tunde, 'section:y', 'Story');
            $this->fail('Tunde should have been refused');
        } catch (LockRefused $refused) {
            $this->assertSame('Ada', $refused->lock['name']);
        }

        $this->assertSame(1, SectionLock::query()->where('unit', 'section:y')->count());
    }

    public function test_activity_renews_a_lock_at_most_once_a_minute(): void
    {
        $this->travelTo(now()->startOfMinute());
        $this->save($this->ada, 'hero.title', 'One', 'section:home.hero')->assertOk();
        $at = SectionLock::query()->first()->last_active_at;

        $this->travel(20)->seconds();
        $this->postJson($this->url('/team/heartbeat'), [], $this->headers($this->ada))->assertOk();
        $this->save($this->ada, 'hero.title', 'Two', 'section:home.hero')->assertOk();
        $this->assertTrue(SectionLock::query()->first()->last_active_at->equalTo($at), 'renewed within the minute');

        $this->travel(61)->seconds();
        $this->postJson($this->url('/team/heartbeat'), [], $this->headers($this->ada))->assertOk();
        $this->assertTrue(SectionLock::query()->first()->last_active_at->greaterThan($at), 'renewed after a minute');
    }

    public function test_publish_puts_live_only_the_publishers_own_sections_and_releases_only_their_locks(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story', 'Story')->assertOk();

        $published = $this->postJson($this->url('/publish'), [], $this->headers($this->ada))->assertOk();
        $published->assertJsonPath('published', 1)->assertJsonPath('left', 1);

        $this->assertSame('Ada hero', $this->live('hero.title'));
        $this->assertSame('Our story', $this->live('story.body'), 'Tunde\'s section stays a draft');
        $this->assertSame(['section:home.story'], SectionLock::query()->pluck('unit')->all(), 'Tunde still holds his');
        $this->assertSame('h:u2', Draft::query()->where('subject', 'story.body')->value('author'));

        $this->postJson($this->url('/publish'), [], $this->headers($this->tunde))->assertOk()->assertJsonPath('published', 1);
        $this->assertSame('Tunde story', $this->live('story.body'));
        $this->assertSame(0, SectionLock::query()->count());
    }

    public function test_the_owner_publishes_only_their_own_unless_they_took_a_section_over(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();

        $this->postJson($this->url('/publish'), [], $this->headers($this->owner))->assertOk()->assertJsonPath('published', 0);
        $this->assertSame('Welcome', $this->live('hero.title'));

        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.hero'], $this->headers($this->owner))->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->owner))->assertOk()->assertJsonPath('published', 1);
        $this->assertSame('Ada hero', $this->live('hero.title'));
    }

    public function test_a_single_editor_site_publishes_everything_as_before(): void
    {
        // The site's own session: nobody in particular, everything is its own.
        $this->save($this->website, 'hero.title', 'New hero')->assertOk();
        $this->save($this->website, 'story.body', 'New story')->assertOk();
        $this->assertSame(0, SectionLock::query()->count(), 'the website itself takes no locks');

        $this->postJson($this->url('/publish'), [], $this->headers($this->website))->assertOk()->assertJsonPath('published', 2);
        $this->assertSame('New hero', $this->live('hero.title'));
        $this->assertSame('New story', $this->live('story.body'));

        // And one named person alone: everything they write is theirs.
        $this->save($this->ada, 'hero.title', 'Ada alone', 'section:home.hero')->assertOk();
        $this->save($this->ada, 'loose.key', 'Not in a section')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->ada))->assertOk()->assertJsonPath('published', 2);
        $this->assertSame(0, Draft::query()->count());
    }

    public function test_an_idle_lock_lapses_after_thirty_minutes_and_the_draft_stays_with_its_author(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();

        $this->travel(29)->minutes();
        $this->postJson($this->url('/team/claim'), ['unit' => 'section:home.hero'], $this->headers($this->tunde))->assertStatus(409);

        $this->travel(2)->minutes();
        $claim = $this->postJson($this->url('/team/claim'), ['unit' => 'section:home.hero', 'label' => 'Hero'], $this->headers($this->tunde))->assertOk();
        $claim->assertJsonPath('left.0.name', 'Ada')->assertJsonPath('left.0.changes', 1);
        $this->assertSame('h:u1', Draft::query()->where('subject', 'hero.title')->value('author'), 'still Ada\'s until Tunde continues');

        $state = $this->getJson($this->url('/team'), $this->headers($this->owner))->assertOk();
        $state->assertJsonPath('left.0.name', 'Ada');

        // Continuing from them: the first save makes them his.
        $this->save($this->tunde, 'hero.title', 'Tunde continues', 'section:home.hero')->assertOk();
        $this->assertSame('h:u2', Draft::query()->where('subject', 'hero.title')->value('author'));

        // Ada is back, and the section is not hers any more.
        $this->save($this->ada, 'hero.title', 'Ada again', 'section:home.hero')->assertStatus(409)->assertJsonPath('error.lock.name', 'Tunde');
    }

    public function test_only_the_owner_may_throw_away_what_somebody_left(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();
        $this->travel(31)->minutes();

        $this->postJson($this->url('/team/discard-left'), ['unit' => 'section:home.hero'], $this->headers($this->tunde))->assertStatus(403);
        $this->postJson($this->url('/team/discard-left'), ['unit' => 'section:home.hero'], $this->headers($this->owner))->assertOk()->assertJsonPath('discarded', 1);
        $this->assertSame(0, Draft::query()->count());
    }

    public function test_the_owner_takes_over_and_the_holder_is_told_on_their_next_action(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();

        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.hero'], $this->headers($this->tunde))->assertStatus(403);
        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.hero'], $this->headers($this->owner))
            ->assertOk()->assertJsonPath('lock.name', 'Olu')->assertJsonPath('lock.taken_from_name', 'Ada');

        $this->assertSame('h:u0', Draft::query()->where('subject', 'hero.title')->value('author'), 'the draft went with the section');

        $this->save($this->ada, 'hero.title', 'Mine!', 'section:home.hero')
            ->assertStatus(409)
            ->assertJsonPath('error.reason', 'taken_over')
            ->assertJsonPath('error.message', 'Olu took over Hero. Your changes there are now theirs to publish.');
    }

    public function test_discard_throws_away_only_my_changes_and_releases_my_sections(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero')->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story')->assertOk();

        $this->postJson($this->url('/team/discard'), [], $this->headers($this->ada))->assertOk()->assertJsonPath('discarded', 1);
        $this->assertSame(['story.body'], Draft::query()->pluck('subject')->all());
        $this->assertSame(['section:home.story'], SectionLock::query()->pluck('unit')->all());
    }

    public function test_the_changes_list_says_whose_change_is_whose(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story', 'Story')->assertOk();

        $list = $this->getJson($this->url('/changes'), $this->headers($this->ada))->assertOk();
        $list->assertJsonPath('yours', 1)->assertJsonPath('others', 1);

        $byKey = collect($list->json('changes'))->keyBy('key');
        $this->assertTrue($byKey['hero.title']['mine']);
        $this->assertSame('Ada', $byKey['hero.title']['author_name']);
        $this->assertSame('Hero', $byKey['hero.title']['unit_label']);
        $this->assertFalse($byKey['story.body']['mine']);
        $this->assertSame('Tunde', $byKey['story.body']['author_name']);

        // Putting back a teammate's change is theirs or the owner's to do.
        $this->deleteJson($this->url('/changes'), ['key' => 'story.body'], $this->headers($this->ada))->assertStatus(409);
        $this->deleteJson($this->url('/changes'), ['key' => 'story.body'], $this->headers($this->owner))->assertOk()->assertJsonPath('reverted', true);
    }

    public function test_history_says_who_published_and_who_changed_what_and_undoing_one_version_keeps_the_other(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->ada))->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story', 'Story')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->tunde))->assertOk();

        $history = $this->getJson($this->url('/versions'), $this->headers($this->owner))->assertOk();
        $history->assertJsonPath('versions.0.published_by', 'Tunde')
            ->assertJsonPath('versions.0.lines.0.author_name', 'Tunde')
            ->assertJsonPath('versions.0.lines.0.label', 'Story')
            ->assertJsonPath('versions.1.published_by', 'Ada')
            ->assertJsonPath('versions.1.lines.0.what', 'the headline')
            ->assertJsonPath('versions.1.lines.0.label', 'Hero');

        $adaVersion = $history->json('versions.1.number');
        $this->postJson($this->url('/versions/'.$adaVersion.'/undo'), [], $this->headers($this->owner))
            ->assertOk()->assertJsonPath('undone', 1);

        $this->assertSame('Welcome', $this->live('hero.title'), 'Ada\'s change taken back');
        $this->assertSame('Tunde story', $this->live('story.body'), 'Tunde\'s left alone');

        $latest = Version::query()->orderByDesc('number')->first();
        $this->assertSame($adaVersion, $latest->undoes);
        $this->assertSame('Olu', $latest->published_by);
    }

    public function test_undo_leaves_a_key_somebody_changed_again_later(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->ada))->assertOk();
        $first = Version::query()->max('number');
        $this->save($this->tunde, 'hero.title', 'Tunde hero', 'section:home.hero')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->tunde))->assertOk();

        $this->postJson($this->url('/versions/'.$first.'/undo'), [], $this->headers($this->owner))
            ->assertOk()->assertJsonPath('undone', 0)->assertJsonPath('kept.0.by', 'Tunde');
        $this->assertSame('Tunde hero', $this->live('hero.title'));
    }

    public function test_rolling_back_says_whose_work_it_undoes_and_keeps_a_teammates_drafts(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->ada))->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde draft', 'section:home.story')->assertOk();

        // Putting the whole site back is for an admin or the owner, never an editor.
        $this->postJson($this->url('/restore'), ['version' => 1], $this->headers($this->tunde))->assertStatus(403);

        $this->postJson($this->url('/restore'), ['version' => 1], $this->headers($this->owner))
            ->assertOk()->assertJsonPath('undoes_work_of', []);

        $this->postJson($this->url('/restore'), ['version' => 1], $this->headers($this->owner))->assertOk();
        $this->assertSame(1, Draft::query()->where('subject', 'story.body')->count(), 'Tunde\'s draft is not the owner\'s to throw away by rolling back');
    }

    public function test_who_holds_what_is_one_cached_answer_and_an_unchanged_poll_costs_no_query(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();

        $first = $this->getJson($this->url('/team'), $this->headers($this->tunde))->assertOk();
        $first->assertJsonPath('you.name', 'Tunde')->assertJsonPath('locks.0.name', 'Ada')->assertJsonPath('locks.0.label', 'Hero');
        $etag = $first->headers->get('ETag');

        // Warm: the key is remembered and the state is cached.
        $this->getJson($this->url('/team'), $this->headers($this->tunde, ['If-None-Match' => $etag]))->assertStatus(304);

        $queries = 0;
        DB::listen(function () use (&$queries) {
            $queries++;
        });

        $this->getJson($this->url('/team'), $this->headers($this->tunde, ['If-None-Match' => $etag]))->assertStatus(304);
        $this->assertSame(0, $queries, 'an unchanged poll asked the database');

        // A change moves the revision, and the next poll sees it.
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story', 'Story')->assertOk();
        $after = $this->getJson($this->url('/team'), $this->headers($this->tunde, ['If-None-Match' => $etag]))->assertOk();
        $this->assertCount(2, $after->json('locks'));
    }

    public function test_a_lapse_is_noticed_by_the_cached_answer_without_anybody_changing_anything(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero')->assertOk();
        $this->getJson($this->url('/team'), $this->headers($this->tunde))->assertOk()->assertJsonCount(1, 'locks');

        $this->travel(31)->minutes();
        $this->getJson($this->url('/team'), $this->headers($this->tunde))->assertOk()->assertJsonCount(0, 'locks');
    }

    public function test_an_editor_signed_in_with_us_is_named_and_the_host_can_say_they_own_the_site(): void
    {
        $editor = Editor::query()->create(['email' => 'ngozi@example.test', 'name' => 'Ngozi']);
        $editor->sites()->attach($this->site->id, ['may_publish' => true]);

        $token = EditorSession::begin($this->site, $editor, 'owner')['token'];

        $this->getJson($this->url('/team'), $this->headers($token))->assertOk()
            ->assertJsonPath('you.name', 'Ngozi')
            ->assertJsonPath('you.role', 'owner')
            ->assertJsonPath('you.id', 'e'.$editor->id);
    }

    public function test_the_prune_command_clears_only_lapsed_locks(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero')->assertOk();
        $this->travel(31)->minutes();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story')->assertOk();

        $this->artisan('live-edit:prune-locks')->assertSuccessful();

        $this->assertSame(['section:home.story'], SectionLock::query()->pluck('unit')->all());
        $this->assertSame(2, Draft::query()->count(), 'drafts are never pruned');
    }

    public function test_a_revoked_key_is_refused_at_once_even_where_keys_are_remembered(): void
    {
        $this->getJson($this->url('/team'), $this->headers($this->ada))->assertOk();

        \ShipFast\LiveEdit\Domain\Site\ApiToken::query()->where('holder_ref', 'u1')->first()->revoke();

        $this->getJson($this->url('/team'), $this->headers($this->ada))->assertStatus(401);
    }

    public function test_what_visitors_read_is_remembered_but_a_publish_shows_at_once(): void
    {
        [, $public] = $this->site->issueToken(TokenType::Publishable, 'Web');

        $this->assertSame('Welcome', $this->getJson($this->url('/content'), $this->headers($public))->assertOk()->json('settings')['hero.title']);

        $queries = 0;
        DB::listen(function () use (&$queries) {
            $queries++;
        });
        $this->getJson($this->url('/content'), $this->headers($public))->assertOk();
        $this->assertLessThanOrEqual(3, $queries, 'a repeated visitor read is the key check, not the content');

        $this->save($this->ada, 'hero.title', 'Fresh', 'section:home.hero')->assertOk();
        $this->postJson($this->url('/publish'), [], $this->headers($this->ada))->assertOk();

        $this->assertSame('Fresh', $this->getJson($this->url('/content'), $this->headers($public))->assertOk()->json('settings')['hero.title']);
    }

    public function test_an_admin_who_is_not_the_owner_may_take_over_and_a_demoted_one_loses_it_at_once(): void
    {
        $kemi = app(IssueEditSession::class)($this->site, 'Kemi', null, true, ['id' => 'u3', 'name' => 'Kemi', 'role' => 'admin'])['token'];
        [, $secret] = $this->site->issueToken(TokenType::Secret, 'Server');

        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story', 'Story')->assertOk();

        $this->getJson($this->url('/team'), $this->headers($kemi))->assertOk()->assertJsonPath('you.role', 'admin');
        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.hero'], $this->headers($kemi))
            ->assertOk()->assertJsonPath('lock.name', 'Kemi');
        $this->save($this->ada, 'hero.title', 'Mine', 'section:home.hero')
            ->assertStatus(409)->assertJsonPath('error.message', 'Kemi took over Hero. Your changes there are now theirs to publish.');

        // The host demotes her: the very next request has no admin power left.
        $this->postJson('/api/live-edit/v1/team/sessions/role', ['id' => 'u3', 'role' => 'editor'], ['Authorization' => 'Bearer '.$secret])
            ->assertOk()->assertJsonPath('sessions', 1);
        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.story'], $this->headers($kemi))->assertStatus(403);
        $this->postJson($this->url('/restore'), ['version' => 1], $this->headers($kemi))->assertStatus(403);
        $this->getJson($this->url('/team'), $this->headers($kemi))->assertOk()->assertJsonPath('you.role', 'editor');
    }

    public function test_an_editor_we_know_is_promoted_and_demoted_on_their_grant(): void
    {
        $editor = Editor::query()->create(['email' => 'bisi@example.test', 'name' => 'Bisi']);
        $editor->sites()->attach($this->site->id, ['may_publish' => true, 'role' => 'editor']);
        $token = EditorSession::begin($this->site, $editor)['token'];

        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero', 'Hero')->assertOk();
        $this->getJson($this->url('/team'), $this->headers($token))->assertJsonPath('you.role', 'editor');
        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.hero'], $this->headers($token))->assertStatus(403);

        $editor->sites()->updateExistingPivot($this->site->id, ['role' => 'admin']);
        $this->getJson($this->url('/team'), $this->headers($token))->assertJsonPath('you.role', 'admin');
        $this->postJson($this->url('/team/take-over'), ['unit' => 'section:home.hero'], $this->headers($token))->assertOk();

        $editor->sites()->updateExistingPivot($this->site->id, ['role' => 'editor']);
        $this->postJson($this->url('/team/discard-left'), ['unit' => 'section:home.hero'], $this->headers($token))->assertStatus(403);
        $this->getJson($this->url('/team'), $this->headers($token))->assertJsonPath('you.role', 'editor');
    }

    public function test_the_publish_count_is_only_your_own_changes(): void
    {
        $this->save($this->ada, 'hero.title', 'Ada hero', 'section:home.hero')->assertOk();
        $this->save($this->tunde, 'story.body', 'Tunde story', 'section:home.story')->assertOk();
        $this->save($this->tunde, 'loose.key', 'More', 'section:home.story')->assertOk();

        $this->getJson($this->url('/content'), $this->headers($this->ada))->assertOk()->assertJsonPath('pending', 1);
        $this->getJson($this->url('/content'), $this->headers($this->tunde))->assertOk()->assertJsonPath('pending', 2);
        $this->getJson($this->url('/content/version'), $this->headers($this->ada))->assertOk()->assertJsonPath('pending', 1);
        // The website itself still counts everything.
        $this->getJson($this->url('/content'), $this->headers($this->website))->assertOk()->assertJsonPath('pending', 3);
    }
}
