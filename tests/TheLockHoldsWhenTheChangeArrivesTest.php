<?php

namespace ShipFast\LiveEdit\Tests;

use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Application\Api\ApplyEdit;
use ShipFast\LiveEdit\Application\Api\ApplyStyle;
use ShipFast\LiveEdit\Application\Api\TagMarkup;
use ShipFast\LiveEdit\Domain\Content\LockedKeys;
use ShipFast\LiveEdit\Domain\Content\LockedRegions;
use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;
use ShipFast\LiveEdit\Models\SiteSetting;

/**
 * data-live-lock used to work by declining to offer: the scanner skipped a
 * locked region, so an invited editor was never shown it and never produced
 * the key. That is a guardrail, and the feature is sold as a boundary - hand
 * over a site without handing over the nav.
 *
 * Nothing re-checked it when the change arrived. The write endpoint takes a
 * key and a value and never sees the page, so it had nothing to decide
 * against, and a key that reached an invited editor by any other route went
 * straight to the store. React made that routine rather than theoretical: its
 * codemod bakes the markers into the source at build time, so no scan ever
 * runs and the lock never applied there at all.
 */
class TheLockHoldsWhenTheChangeArrivesTest extends TestCase
{
    private const PAGE = <<<'HTML'
        <html><body>
            <nav data-live-lock>
                <a href="/pricing">Pricing</a>
                <p>Built by the agency</p>
            </nav>
            <main>
                <h1>Welcome to Acme</h1>
                <p>We sell things to people who need them.</p>
            </main>
        </body></html>
        HTML;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('live-edit.auto_keys', true);
        config()->set('live-edit.tag_cache_seconds', 0);
    }

    private function site(): Site
    {
        return Site::query()->create([
            'slug' => 'acme',
            'name' => 'Acme',
            'allowed_origins' => ['https://acme.test'],
        ]);
    }

    /** A session for somebody the developer invited: narrowed. */
    private function invited(Site $site)
    {
        [$token] = $site->issueToken(
            TokenType::Session, 'Edit', [Ability::Read, Ability::Write], now()->addHour(), null, false,
        );

        return $token;
    }

    /** The developer's own key: sees everything, as it always did. */
    private function developer(Site $site)
    {
        [$token] = $site->issueToken(TokenType::Secret, 'Web', null, now()->addYear());

        return $token;
    }

    /** Tag the page as an ordinary visitor would, which is what records the lock. */
    private function scan(Site $site, ?string $html = null): void
    {
        app(TagMarkup::class)($site, $html ?? self::PAGE, 'home', true);
    }

    /** @return array<int, string> */
    private function lockedKeys(Site $site): array
    {
        return LockedKeys::query()->where('site_id', $site->id)->get()
            ->flatMap(fn (LockedKeys $row) => $row->keys)->values()->all();
    }

    public function test_a_full_scan_writes_down_what_is_behind_the_lock(): void
    {
        $site = $this->site();
        $this->scan($site);

        $this->assertNotEmpty(
            $this->lockedKeys($site),
            'nothing recorded what the nav keeps, so the write path has nothing to refuse against',
        );
    }

    public function test_an_invited_editor_cannot_write_into_the_locked_region(): void
    {
        $site = $this->site();
        $this->scan($site);

        $key = $this->lockedKeys($site)[0];

        $this->expectException(ValidationException::class);

        app(ApplyEdit::class)($site, $this->invited($site), $key, 'Our prices now');
    }

    public function test_the_refusal_actually_stops_the_write(): void
    {
        // A refusal that throws after the row is written is not a refusal.
        $site = $this->site();
        $this->scan($site);

        $key = $this->lockedKeys($site)[0];

        try {
            app(ApplyEdit::class)($site, $this->invited($site), $key, 'Our prices now');
        } catch (ValidationException) {
            // expected
        }

        $this->assertDatabaseMissing('live_edit_site_settings', [
            'site_id' => $site->id,
            'key' => $key,
        ]);
    }

    public function test_the_developer_may_still_write_the_very_same_key(): void
    {
        /*
         * The point of the lock is who, not what. A developer holding the
         * site's own key is who the nav belongs to, and refusing them would
         * make the feature a way of locking yourself out of your own markup.
         */
        $site = $this->site();
        $this->scan($site);

        $key = $this->lockedKeys($site)[0];

        app(ApplyEdit::class)($site, $this->developer($site), $key, 'Our prices now');

        $this->assertDatabaseHas('live_edit_site_settings', [
            'site_id' => $site->id,
            'key' => $key,
            'value' => 'Our prices now',
        ]);
    }

    public function test_an_invited_editor_still_edits_everything_else(): void
    {
        // The failure that would matter most on the day this ships: a check
        // that is too eager and refuses the whole site.
        $site = $this->site();
        $this->scan($site);

        $locked = $this->lockedKeys($site);
        $open = 'auto:'.substr(hash('sha256', 'nothing to do with the nav'), 0, 12);

        $this->assertNotContains($open, $locked);

        app(ApplyEdit::class)($site, $this->invited($site), $open, 'A new headline');

        $this->assertDatabaseHas('live_edit_site_settings', [
            'site_id' => $site->id,
            'key' => $open,
            'value' => 'A new headline',
        ]);
    }

    public function test_a_site_nobody_has_scanned_behaves_exactly_as_before(): void
    {
        /*
         * This does not fail closed, deliberately. A site with no record has
         * no locks as far as anything here knows, and refusing every narrowed
         * write on that basis would lock out every invited editor on every
         * site the day this ships, to protect sites that mostly have none.
         */
        $site = $this->site();

        app(ApplyEdit::class)($site, $this->invited($site), 'auto:1a2b3c4d5e6f', 'Still works');

        $this->assertDatabaseHas('live_edit_site_settings', [
            'site_id' => $site->id,
            'key' => 'auto:1a2b3c4d5e6f',
        ]);
    }

    public function test_an_invited_editor_cannot_report_the_lock_away(): void
    {
        /*
         * The way this came apart when it was first built, and the reason
         * clearing is privileged.
         *
         * Locks are reported by the page, and a page reports with the
         * publishable key, which is printed in that page for everybody to
         * read. The invited editor is on that page holding it. So without this
         * rule the whole feature took two requests to defeat: send a copy of
         * the markup with the lock taken out, then write to the nav it no
         * longer protects.
         */
        $site = $this->site();
        $this->scan($site);

        $before = $this->lockedKeys($site);
        $this->assertNotEmpty($before);

        $locks = app(LockedRegions::class);
        $lockFree = str_replace(' data-live-lock', '', self::PAGE);

        // What the invited editor can do: report, but never clear.
        $locks->record($site, 'home', $lockFree, false);

        $this->assertSame($before, $this->lockedKeys($site), 'an invited editor reported the lock away');

        $this->expectException(ValidationException::class);
        app(ApplyEdit::class)($site, $this->invited($site), $before[0], 'Mine now');
    }

    public function test_a_lock_taken_out_of_the_markup_stops_binding(): void
    {
        // Otherwise the only way to unlock something would be a support
        // request, and the markup would stop being the truth. The developer's
        // own key may clear, which is the whole difference from the test above.
        $site = $this->site();
        $this->scan($site);

        $this->assertNotEmpty($this->lockedKeys($site));

        app(LockedRegions::class)
            ->record($site, 'home', str_replace(' data-live-lock', '', self::PAGE), true);

        $this->assertSame(
            [],
            $this->lockedKeys($site),
            'the developer took the lock out of the markup and it went on binding anyway',
        );
    }

    public function test_a_narrowed_scan_does_not_erase_what_a_full_scan_recorded(): void
    {
        /*
         * The subtle way to break this. A narrowed scan has already skipped
         * the locked subtrees, so it finds nothing behind a lock - and if it
         * were allowed to record that, the first invited editor to load the
         * page would clear the site's locks and then be free to write to them.
         */
        $site = $this->site();
        $this->scan($site);

        $before = $this->lockedKeys($site);

        app(TagMarkup::class)($site, self::PAGE, 'home', false);

        $this->assertSame($before, $this->lockedKeys($site));
    }

    public function test_a_locked_region_cannot_be_restyled_either(): void
    {
        /*
         * A style is a separate key namespace off the same element - "s" and
         * the hash where the words are "auto:" and the hash - so guarding the
         * words alone would leave an invited editor able to hide the nav, or
         * paint it, having just been refused its text.
         */
        $site = $this->site();
        $this->scan($site);

        // Matched on the shape a style key actually has - "s" and twelve hex -
        // because "starts with s" also matches a shared: key, and a shared:
        // key is refused by the style policy for having a colon in it. That
        // refusal looked exactly like this one passing.
        $style = collect($this->lockedKeys($site))
            ->first(fn (string $k) => (bool) preg_match('/^s[0-9a-f]{12}$/', $k));

        $this->assertNotNull($style, 'the page produced no style key behind the lock, so this proves nothing');

        $this->expectException(ValidationException::class);

        app(ApplyStyle::class)($site, $this->invited($site), $style, ['background' => '#ff0000']);
    }

    public function test_a_page_that_never_tags_can_still_report_its_locks(): void
    {
        /*
         * React's codemod writes the markers into the source at build time, so
         * a React page arrives prepared and asks the scanner nothing - which
         * left data-live-lock recorded nowhere, and so enforced nowhere, on
         * the one adapter whose README admitted it did not work.
         *
         * Nothing here needs a scan. The markers and the lock are both already
         * in the markup; this only reads which of the first sit inside the
         * second. The markup below is what a codemod leaves behind.
         */
        $site = $this->site();

        $alreadyTagged = <<<'HTML'
            <html><body>
                <nav data-live-lock><a data-edit="setting:auto:deadbeef1234" href="/pricing">Pricing</a></nav>
                <h1 data-edit="setting:auto:cafebabe5678">Welcome</h1>
            </body></html>
            HTML;

        app(LockedRegions::class)->record($site, 'home', $alreadyTagged);

        $this->assertSame(['auto:deadbeef1234'], $this->lockedKeys($site));

        $this->expectException(ValidationException::class);

        app(ApplyEdit::class)($site, $this->invited($site), 'auto:deadbeef1234', 'Our prices');
    }

    public function test_the_alt_text_of_a_locked_picture_is_locked_too(): void
    {
        /*
         * A picture's description is written beside it under its own name with
         * a suffix - auto:1a2b3c becomes auto:1a2b3cAlt - and the editor
         * composes that suffix on. Matching the literal string only would have
         * refused the locked logo and allowed its alt text, which is the kind
         * of half-closed door that is worse than an open one.
         */
        $site = $this->site();

        app(LockedRegions::class)->record($site, 'home', <<<'HTML'
            <html><body><nav data-live-lock>
                <img data-edit-img="auto:deadbeef1234" src="/logo.png" alt="Acme">
            </nav></body></html>
            HTML);

        $this->expectException(ValidationException::class);

        app(ApplyEdit::class)($site, $this->invited($site), 'auto:deadbeef1234Alt', 'A new description');
    }

    public function test_locking_one_site_does_not_lock_another(): void
    {
        // Two customers on the same theme produce the same keys. One of them
        // locking their nav must not refuse the other's editor.
        $acme = $this->site();
        $this->scan($acme);

        $other = Site::query()->create([
            'slug' => 'other',
            'name' => 'Other',
            'allowed_origins' => ['https://other.test'],
        ]);

        $key = $this->lockedKeys($acme)[0];

        app(ApplyEdit::class)($other, $this->invited($other), $key, 'Mine to change');

        $this->assertDatabaseHas('live_edit_site_settings', [
            'site_id' => $other->id,
            'key' => $key,
        ]);
        $this->assertSame(0, SiteSetting::query()->where('site_id', $acme->id)->count());
    }
}
