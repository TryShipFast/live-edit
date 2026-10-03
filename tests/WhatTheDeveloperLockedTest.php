<?php

namespace ShipFast\LiveEdit\Tests;

use ShipFast\LiveEdit\Mapper\MarkupScanner;

/**
 * The half of the site the client does not get to change.
 *
 * A developer hands over a site with their name on it. They will forgive a
 * rough install; they will not forgive a client breaking the navigation. Until
 * this, the only honest answer to "can they wreck my layout?" was that they
 * could, and that the developer would have to trust them not to.
 *
 * Marked in the markup rather than in a dashboard, which is the same rule the
 * scanner already follows for x-text: the page's author saying out loud that
 * something is not ours. It is reviewable in a pull request, it survives a
 * redeploy for the same reason an edit does, and it cannot drift out of step
 * with a setting somebody changed in a browser eight months ago.
 *
 * And it is per person, which is what stops guardrails and coverage pulling
 * against each other. Widening what CAN be edited - accent words, links inside
 * sentences - no longer widens what a client can break, because the developer
 * holding the session still sees all of it.
 */
class WhatTheDeveloperLockedTest extends TestCase
{
    private function tag(string $html, bool $invited = false): string
    {
        $scanner = (new MarkupScanner)->asAnInvitedEditor($invited);

        return $scanner->apply($html, ['text', 'image', 'link', 'icon'], true)['html'];
    }

    private function keys(string $html): int
    {
        return preg_match_all('/data-edit(?:-img|-href|-bg)?="setting:auto:/', $html);
    }

    private const SITE = '<body>'
        .'<nav data-live-lock><a href="/pricing">Pricing</a><a href="/about">About</a></nav>'
        .'<main><h1>Promote your music</h1><p>Real curators, real reach.</p></main>'
        .'<footer data-live-lock><p>© 2026 NewBanger</p></footer>'
        .'</body>';

    public function test_an_invited_editor_is_not_offered_the_locked_parts(): void
    {
        $tagged = $this->tag(self::SITE, invited: true);

        // Still on the page - locking is about editing, not hiding.
        $this->assertStringContainsString('Pricing', $tagged);
        $this->assertSame(0, preg_match_all('/data-edit-item=/', $tagged), 'the locked nav could still be reordered');
        $this->assertSame(
            0,
            preg_match_all('/<(nav|footer)[^>]*data-edit/', $tagged),
            'the locked regions were offered to somebody who may not edit them'
        );
        $this->assertStringContainsString('data-edit=', $tagged, 'nothing at all was editable');
    }

    public function test_the_words_inside_a_locked_region_are_left_alone_too(): void
    {
        /*
         * Refusing the nav itself is not enough - the links and the copyright
         * line inside it are what somebody would actually click. This is the
         * same lesson the WordPress toolbar taught: ninety-four pieces of it
         * were styleable because only the container had been refused.
         */
        $tagged = $this->tag(self::SITE, invited: true);

        $this->assertStringNotContainsString('Pricing</a>', $this->editableFragmentsOf($tagged));
        $this->assertStringNotContainsString('© 2026', $this->editableFragmentsOf($tagged));
    }

    public function test_the_developer_still_sees_everything(): void
    {
        // The whole point of marking it per person rather than per site.
        $tagged = $this->tag(self::SITE, invited: false);

        $this->assertGreaterThan(
            $this->keys($this->tag(self::SITE, invited: true)),
            $this->keys($tagged),
            'the developer was offered no more than the client'
        );
        $this->assertStringContainsString('<nav data-live-lock', $tagged);
        $this->assertMatchesRegularExpression('/<footer[^>]*data-style=/', $tagged);
    }

    public function test_the_rest_of_the_page_is_untouched_by_the_lock(): void
    {
        $tagged = $this->tag(self::SITE, invited: true);

        $this->assertMatchesRegularExpression('/<h1[^>]*data-edit="setting:auto:/', $tagged);
        $this->assertMatchesRegularExpression('/<p[^>]*data-edit="setting:auto:/', $tagged);
    }

    public function test_a_locked_region_cannot_be_restyled_either(): void
    {
        /*
         * Breaking a nav does not require editing its words. Colour, spacing
         * and a corner radius are quite enough, and the styling pass walks the
         * document flat rather than descending - so it has to refuse the
         * subtree by itself.
         */
        $tagged = $this->tag(self::SITE, invited: true);

        $this->assertSame(
            0,
            preg_match_all('/<(nav|footer|a)[^>]*data-style=/', $tagged),
            'a locked region was offered for restyling'
        );
    }

    public function test_the_longer_spelling_is_accepted(): void
    {
        // data-live-lock is what anybody would type; the prefixed one is for a
        // host whose markup already carries other people's short attributes.
        $tagged = $this->tag('<body><nav data-live-edit-lock><a href="/x">Hidden</a></nav><p>Open</p></body>', invited: true);

        $this->assertSame(0, preg_match_all('/<(nav|a)[^>]*data-edit/', $tagged));
        $this->assertMatchesRegularExpression('/<p[^>]*data-edit=/', $tagged);
    }

    public function test_nothing_changes_for_a_scan_nobody_narrowed(): void
    {
        /*
         * Every existing caller - the export, the WordPress pass, the scan
         * command - asks for a page rather than for a person, and must keep
         * getting the whole page.
         */
        $asBefore = (new MarkupScanner)->apply(self::SITE, ['text', 'image', 'link', 'icon'], true)['html'];

        $this->assertSame($this->keys($this->tag(self::SITE, invited: false)), $this->keys($asBefore));
    }

    private function editableFragmentsOf(string $html): string
    {
        preg_match_all('/<[^>]*data-edit="setting:auto:[^"]*"[^>]*>([^<]*)/', $html, $found);

        return implode(' | ', $found[1]);
    }
}
