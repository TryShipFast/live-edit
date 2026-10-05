<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Content\LockedRegions;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Content\StylePolicy;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Meter;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\OneAction;

/**
 * How a section looks, on a site that is not this application.
 *
 * The reading half of this was already built — styles are in the content the
 * API answers with, they are held as drafts, they are published and they go
 * into the snapshot files. Only the write was missing, so a style set on a
 * Laravel page reached a static site perfectly well and somebody editing that
 * static site could not set one. The editor said so rather than pretending,
 * which is the one good thing about how this was found.
 */
class ApplyStyle
{
    public function __construct(
        private readonly StylePolicy $policy,
        private readonly LockedRegions $locked,
    ) {}

    /**
     * @param  array<string, string|null>  $props
     * @return array{saved: true, key: string, held: bool, props: array<string, string>}
     *
     * @throws ValidationException
     */
    public function __invoke(Site $site, ApiToken $token, string $key, array $props): array
    {
        throw_unless(
            $this->policy->permitsKey($key),
            ValidationException::withMessages(['key' => 'Unknown style.'])
        );

        /*
         * A locked region's appearance is locked too.
         *
         * Styles are a separate key namespace off the same element - a style
         * key is "s" and the hash where the words are "auto:" and the hash -
         * so guarding the words alone would leave an invited editor able to
         * hide the nav, or paint it, having been refused its text.
         */
        if ($this->locked->refuses($site, $token, $key)) {
            throw ValidationException::withMessages([
                'key' => 'That part of the site is the developer\'s to change.',
            ]);
        }

        $clean = $this->policy->clean($props);

        if (! Meter::allows($site, Meter::WRITE)) {
            throw new OverLimit('This site has reached its limit of saved changes for this month.');
        }

        $hold = DraftStore::enabled();

        (new SiteStore($site))->putStyle($key, $clean, $hold);

        EditRevision::query()->create([
            'batch' => OneAction::by($site->slug, (string) $token->public_id),
            'action' => 'style',
            'subject' => $key,
            'payload' => ['site' => $site->slug, 'held' => $hold],
        ]);

        Meter::record($site, Meter::WRITE);

        return ['saved' => true, 'key' => $key, 'held' => $hold, 'props' => $clean];
    }
}
