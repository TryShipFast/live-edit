<?php

namespace ShipFast\LiveEdit\Domain\Content;

/**
 * How many pages of a site may be edited, and which ones.
 *
 * The engine counts; it has never heard of a plan. The number arrives on the
 * site's own `limits`, written there by whoever sells the thing, which is the
 * only reason this package can be installed by somebody who has never seen our
 * price list.
 *
 * WHICH page, when the allowance is smaller than the site, is decided by
 * whoever gets there first and then never moves. Two other rules were
 * possible and both are worse:
 *
 *   - The home page. Punishes anybody whose important page is not "/", and
 *     there are plenty: a menu, a booking page, a single long sales page
 *     reached from an advert.
 *   - Whichever page you are on now. Means editing a second page silently
 *     takes editing away from the first, so somebody's work becomes
 *     unreachable by visiting a different URL. A limit has to be felt as a
 *     limit rather than as the product losing things.
 *
 * Refusing is the whole point, so it refuses out loud. Nothing here stops a
 * page RENDERING: a page over the allowance is served exactly as a visitor
 * sees it, published words and all, and only the editing is withheld. That is
 * the same rule an unpaid licence follows, for the same reason.
 */
class PageAllowance
{
    /**
     * @param  string  $scope  A site's id on the service, its slug on a customer's own install
     * @param  array<string, mixed>  $limits  From the site row, or from the licence answer
     */
    public function __construct(
        private readonly string $scope,
        private readonly array $limits = [],
    ) {}

    /**
     * How many pages may be edited. Null is all of them.
     *
     * Absent means no limit rather than none allowed, and the difference is
     * the whole product: a service that cannot be reached, an older service
     * that does not send this, and a customer on an unlimited plan all arrive
     * here looking identical, and all three have to leave somebody editing.
     */
    public function limit(): ?int
    {
        if (! array_key_exists('pages', $this->limits) || $this->limits['pages'] === null) {
            return null;
        }

        return max(0, (int) $this->limits['pages']);
    }

    /**
     * Whether this page may be edited, claiming it if there is room.
     *
     * Claiming happens here rather than in a separate call, because the two
     * must not be able to disagree: a check that said yes and a claim that
     * never ran would let somebody edit a page the next request refuses.
     */
    public function permits(string $page): bool
    {
        $page = $this->normalise($page);
        $limit = $this->limit();

        if ($limit === null) {
            $this->remember($page);

            return true;
        }

        $claimed = $this->claimed();

        // Already theirs. Checked before the count so that the one page a Free
        // account edits keeps working for ever, which is the entire promise of
        // the free tier.
        if (in_array($page, $claimed, true)) {
            $this->remember($page);

            return true;
        }

        if (count($claimed) >= $limit) {
            return false;
        }

        $this->remember($page);

        return true;
    }

    /**
     * The pages claimed, oldest first.
     *
     * @return array<int, string>
     */
    public function claimed(): array
    {
        return SitePage::query()
            ->where('scope', $this->scope)
            ->orderBy('first_edited_at')
            ->orderBy('id')
            ->pluck('page')
            ->all();
    }

    /**
     * What to tell somebody who has run out, without naming a plan.
     *
     * The words for the upgrade belong to whoever sells it. This says what
     * happened and what is true, and the console's own copy does the selling:
     * a package that hardcoded "upgrade to Basic" would be wrong the first
     * time a tier was renamed, on every customer's server at once.
     *
     * @return array<string, mixed>
     */
    public function refusal(): array
    {
        $limit = $this->limit();

        return [
            'reason' => 'page_limit',
            'allowed' => $limit,
            'editing' => $this->claimed(),
            'message' => $limit === 1
                ? 'This plan covers editing one page, and it is already in use on another page of this site. The page below is live and unchanged.'
                : sprintf('This plan covers editing %d pages, and they are already in use on this site. The page below is live and unchanged.', (int) $limit),
        ];
    }

    private function remember(string $page): void
    {
        $row = SitePage::query()->firstOrNew([
            'scope' => $this->scope,
            'page' => $page,
        ]);

        $row->first_edited_at ??= now();
        $row->last_edited_at = now();
        $row->save();
    }

    /**
     * One spelling for one page.
     *
     * "/about", "/about/" and "about" are the same page to a person and three
     * rows to a database, which on an allowance of one means a trailing slash
     * costs somebody their free tier.
     *
     * Slashes only. Deciding what counts as a page belongs to whoever names
     * it: an adapter knows whether its site distinguishes pages by path or by
     * a query string, and this does not. An earlier version stripped the query
     * here, which quietly merged every page of a WordPress site with pretty
     * permalinks switched off into one.
     */
    private function normalise(string $page): string
    {
        $page = trim($page);

        if ($page === '' || $page === '/') {
            return '';
        }

        return '/'.trim($page, '/');
    }
}
