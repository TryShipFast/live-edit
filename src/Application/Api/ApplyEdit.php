<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Content\EditPolicy;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Support\DraftStore;

/**
 * Writes one change, through the same rules the editor writes through.
 *
 * With publishing on, the change is held as a draft and the live site does not
 * move until someone releases it — the same for an API caller as for a person
 * clicking in the page, because "who wrote it" should not decide "when does the
 * public see it".
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

        if (DraftStore::enabled()) {
            DraftStore::put('setting', $stored, ['value' => $value]);

            return ['saved' => true, 'key' => $stored, 'held' => true];
        }

        $model = config('live-edit.setting_model');
        $existing = $model::query()->where('key', $stored)->first();

        // Recorded against the key that made the change, not a user: a site's
        // own people are not accounts here, and "which integration did this"
        // is the question an operator actually needs answered.
        EditRevision::query()->create([
            'batch' => 'api:'.$token->public_id,
            'action' => 'setting',
            'subject' => $stored,
            'payload' => ['value' => $existing?->value, 'existed' => $existing !== null],
        ]);

        $model::query()->updateOrCreate(['key' => $stored], ['value' => $value]);

        return ['saved' => true, 'key' => $stored, 'held' => false];
    }
}
