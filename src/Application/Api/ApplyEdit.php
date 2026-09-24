<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Content\EditPolicy;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Support\DraftStore;

/**
 * Writes one change, to one site, through the same rules the editor writes
 * through.
 */
class ApplyEdit
{
    public function __construct(private readonly EditPolicy $policy) {}

    /**
     * @return array{saved: true, key: string, held: bool}
     *
     * @throws ValidationException
     */
    public function __invoke(Site $site, ApiToken $token, string $key, string $value, ?string $locale = null): array
    {
        $this->policy->assert($key, $value);

        if ($locale !== null && $locale !== '' && ! array_key_exists($locale, config('live-edit.locales', []))) {
            throw ValidationException::withMessages(['locale' => 'Unknown locale.']);
        }

        $stored = $this->policy->localeKey($key, $locale);
        $hold = DraftStore::enabled();

        (new SiteStore($site))->put($stored, $value, $hold);

        // Recorded against the key that made the change and the site it
        // belongs to, not a user: a site's own people are not accounts here.
        EditRevision::query()->create([
            'batch' => 'api:'.$site->slug.':'.$token->public_id,
            'action' => 'setting',
            'subject' => $stored,
            'payload' => ['site' => $site->slug, 'held' => $hold],
        ]);

        return ['saved' => true, 'key' => $stored, 'held' => $hold];
    }
}
