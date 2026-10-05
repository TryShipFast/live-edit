<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Content\EditPolicy;
use ShipFast\LiveEdit\Domain\Content\LockedRegions;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Meter;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Support\DraftStore;
use ShipFast\LiveEdit\Support\OneAction;

/**
 * Writes one change, to one site, through the same rules the editor writes
 * through.
 */
class ApplyEdit
{
    public function __construct(
        private readonly EditPolicy $policy,
        private readonly LockedRegions $locked,
    ) {}

    /**
     * @return array{saved: true, key: string, held: bool}
     *
     * @throws ValidationException
     */
    public function __invoke(Site $site, ApiToken $token, string $key, string $value, ?string $locale = null): array
    {
        $this->policy->assert($key, $value);

        /*
         * The developer's half of the site stays the developer's.
         *
         * The scanner already refuses to offer a locked region to somebody
         * who was invited, so the editor never shows this and never sends it.
         * That is a guardrail and it is not a boundary: it worked by declining
         * to hand out a key, and a key that arrives anyway - from a colleague,
         * from an earlier unnarrowed session, from a React build whose markers
         * were baked in and never scanned - went straight through to the
         * store. Asked here because this is where every adapter meets.
         */
        if ($this->locked->refuses($site, $token, $key)) {
            throw ValidationException::withMessages([
                'key' => 'That part of the site is the developer\'s to change.',
            ]);
        }

        // The site's own languages, not the installation's. On the service
        // one list would be one list for every customer, so a site would be
        // refused its own French and offered somebody else's.
        if ($locale !== null && $locale !== '' && ! array_key_exists($locale, $site->languages())) {
            throw ValidationException::withMessages(['locale' => 'That language is not one of this site\'s.']);
        }

        if (! Meter::allows($site, Meter::WRITE)) {
            throw new OverLimit('This site has reached its limit of saved changes for this month.');
        }

        $stored = $this->policy->localeKey($key, $locale, $site->writtenIn());
        $hold = DraftStore::enabled();

        (new SiteStore($site))->put($stored, $value, $hold);

        // Recorded against the key that made the change and the site it
        // belongs to, not a user: a site's own people are not accounts here.
        EditRevision::query()->create([
            'batch' => OneAction::by($site->slug, (string) $token->public_id),
            'action' => 'setting',
            'subject' => $stored,
            'payload' => ['site' => $site->slug, 'held' => $hold],
        ]);

        Meter::record($site, Meter::WRITE);

        return ['saved' => true, 'key' => $stored, 'held' => $hold];
    }
}
