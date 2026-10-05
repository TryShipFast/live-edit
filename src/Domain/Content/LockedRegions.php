<?php

namespace ShipFast\LiveEdit\Domain\Content;

use DOMDocument;
use DOMElement;
use DOMXPath;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * What the developer kept, enforced where the change actually arrives.
 *
 * data-live-lock worked by declining to offer: the scanner skipped a locked
 * subtree, so an invited editor was never shown it and the editor never
 * produced the key. That is a guardrail. It is not a boundary, and the feature
 * is sold as one - hand over a site without handing over the nav.
 *
 * The gap is visible in the write endpoint's own signature. It takes a key and
 * a value; it never sees the page, so it had nothing to decide against. An
 * invited editor who came by a key inside the nav - from a colleague, from an
 * earlier unnarrowed session, from a second site on the same theme - could set
 * it, and nothing in the stack would notice. The React adapter made that
 * routine rather than theoretical: its codemod bakes the markers into the
 * source at build time, so no scan runs and the lock never applied at all.
 *
 * So the page writes down what it kept, while it is being tagged and the shape
 * is still in hand, and the write path reads it back. That puts the check
 * behind every adapter at once, including the ones that never ask the scanner
 * anything, because none of them can reach the store without passing here.
 *
 * It does not fail closed, and that is deliberate. A site nothing has scanned
 * in full has no record, and refusing every narrowed write on that basis would
 * lock out every existing invited editor the day this ships, to protect sites
 * that mostly have no locks at all. It enforces exactly what it has been told
 * about, and a full scan - which every ordinary visitor already triggers,
 * because a page tagged for nobody in particular is tagged in full - is what
 * tells it.
 */
class LockedRegions
{
    /**
     * Every attribute the scanner writes a key into.
     *
     * One autoKey fans out into four namespaces: words and pictures under
     * "setting:auto:", a link's href, a list's identity, and a style under
     * "s". A namespace missing from this list is a locked element somebody can
     * still write to, which is the whole failure being fixed, so it reads the
     * attributes off the tagged markup rather than trying to recompute them.
     */
    protected const KEY_ATTRIBUTES = [
        'data-edit',
        'data-edit-img',
        'data-edit-bg',
        'data-edit-href',
        'data-edit-icon',
        'data-edit-svg',
        'data-edit-list',
        'data-edit-item',
        'data-style',
    ];

    /** Both spellings the scanner accepts, so the two agree on what a lock is. */
    protected const LOCK_ATTRIBUTES = ['data-live-lock', 'data-live-edit-lock'];

    /**
     * Remember what this page keeps behind a lock.
     *
     * Only ever called with markup from a scan that was NOT narrowed. A
     * narrowed scan has already skipped the locked subtrees, so it would find
     * nothing there and record an empty set - which would read as "this page
     * locks nothing" and quietly undo the protection for everybody.
     */
    public function record(Site $site, string $page, string $taggedHtml, bool $mayClear = false): void
    {
        $keys = $this->keysBehindALock($taggedHtml);

        $existing = LockedKeys::query()
            ->where('site_id', $site->id)
            ->where('page', $page)
            ->first();

        /*
         * Taking a lock off is the developer's to do, and nobody else's.
         *
         * This is reported by the page, and the key a page reports with is the
         * publishable one, which is printed in that page for everybody. So the
         * markup arriving here is only as trustworthy as a public key: anyone
         * holding it can send whatever HTML they like, including HTML with the
         * locks taken out.
         *
         * The person that matters is the invited editor, because they are who
         * the lock is against and they are already on the page holding that
         * key. Left clearing open, the whole feature came apart in two
         * requests: report a lock-free copy of the page, then write to the nav
         * it no longer protects.
         *
         * So a report can only ever ADD. Clearing needs a key that can write
         * and has not been narrowed - the developer, or their own session -
         * which is the same person who put the lock in the markup.
         */
        if (! $mayClear) {
            $keys = array_values(array_unique([...($existing->keys ?? []), ...$keys]));
            sort($keys);
        }

        // A page that locks nothing and never did is not worth a row, but one
        // that used to lock something must be cleared when the developer takes
        // the lock out of the markup, or the markup stops being the truth.
        if ($keys === []) {
            $existing?->delete();

            return;
        }

        if ($existing && $existing->keys === $keys) {
            return;
        }

        LockedKeys::query()->updateOrCreate(
            ['site_id' => $site->id, 'page' => $page],
            ['keys' => $keys],
        );
    }

    /**
     * What one page of this site is holding back, as recorded.
     *
     * @return array<int, string>
     */
    public function keysFor(Site $site, string $page): array
    {
        $row = LockedKeys::query()
            ->where('site_id', $site->id)
            ->where('page', $page)
            ->first();

        return $row ? $row->keys : [];
    }

    /**
     * Whether this change must be refused.
     *
     * Asked of the token rather than the site, because the same key is the
     * developer's to change and not the client's. A token nobody narrowed -
     * the site's own keys, a host-minted session, every caller that predates
     * the feature - is unaffected.
     */
    public function refuses(Site $site, ApiToken $token, string $key): bool
    {
        if ($token->mayEditLocked()) {
            return false;
        }

        return $this->isLocked($site, $key);
    }

    /** Whether this key sits behind a lock anywhere on the site. */
    public function isLocked(Site $site, string $key): bool
    {
        $locked = $this->lockedFor($site);

        if ($locked === []) {
            return false;
        }

        return in_array($key, $locked, true)
            || in_array($this->bare($key), $locked, true);
    }

    /**
     * Every locked key on the site, across its pages.
     *
     * Unioned rather than matched page by page, because the write carries no
     * page: it is a key and a value. Where that is ambiguous - the same key
     * locked on one page and open on another, which a shared nav makes
     * ordinary - the union is the answer that keeps the lock, and a lock that
     * holds somewhere is better than one that holds nowhere.
     *
     * @return array<int, string>
     */
    protected function lockedFor(Site $site): array
    {
        return LockedKeys::query()
            ->where('site_id', $site->id)
            ->pluck('keys')
            ->flatMap(fn ($keys) => is_array($keys) ? $keys : [])
            ->unique()
            ->values()
            ->all();
    }

    /**
     * The key with the parts the editor composes onto it taken off.
     *
     * A picture's description arrives as auto:1a2b3cAlt and a repeated card's
     * words as auto:1a2b3c@i0, and both name an element the lock was recorded
     * against under its plain name. Checking only the literal string would let
     * the alt text of a locked picture through.
     */
    protected function bare(string $key): string
    {
        // "@i0" and friends: the row a repeated element sits in.
        if (($at = strpos($key, '@')) !== false) {
            $key = substr($key, 0, $at);
        }

        foreach (Companions::ALL as $suffix) {
            if ($suffix !== '' && str_ends_with($key, $suffix)) {
                return substr($key, 0, -strlen($suffix));
            }
        }

        return $key;
    }

    /**
     * Every key on an element that has a lock above it, or on it.
     *
     * ancestor-or-self, because the locked element is usually the one carrying
     * the keys - a <nav data-live-lock> whose links are each editable - and an
     * ancestors-only test would have let the lock's own element through.
     *
     * @return array<int, string>
     */
    protected function keysBehindALock(string $html): array
    {
        if ($html === '') {
            return [];
        }

        $doc = new DOMDocument;
        libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);

        $locked = implode(' or ', array_map(fn (string $a) => "@{$a}", self::LOCK_ATTRIBUTES));
        $carries = implode(' or ', array_map(fn (string $a) => "@{$a}", self::KEY_ATTRIBUTES));

        $found = $xpath->query("//*[({$carries}) and ancestor-or-self::*[{$locked}]]");

        if ($found === false) {
            return [];
        }

        $keys = [];

        foreach ($found as $node) {
            if (! $node instanceof DOMElement) {
                continue;
            }

            foreach (self::KEY_ATTRIBUTES as $attribute) {
                $key = $this->keyFrom($node->getAttribute($attribute));

                if ($key !== null) {
                    $keys[$key] = true;
                }
            }
        }

        $keys = array_keys($keys);
        sort($keys);

        return $keys;
    }

    /**
     * The key as the store holds it.
     *
     * Markup writes "setting:auto:abc" where a row is keyed "auto:abc", so
     * recording the attribute verbatim would match nothing on the way back in.
     * Model-backed records are skipped: their ids are database ids, they are
     * not the scanner's to lock, and a lock on one would be a lock on a row
     * every page shares.
     */
    protected function keyFrom(string $value): ?string
    {
        if ($value === '' || str_starts_with($value, 'record:')) {
            return null;
        }

        if (str_starts_with($value, 'setting:')) {
            $value = substr($value, 8);
        }

        return $value === '' ? null : $value;
    }
}
