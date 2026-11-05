<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Database\Eloquent\Relations\Pivot;
use ShipFast\LiveEdit\Domain\Team\Person;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

/**
 * One person's grant on one site: may they publish, may they edit what the
 * developer locked, and their role (owner, admin or editor).
 *
 * A model of its own so a change to it is heard: who-is-editing reads
 * remember a person for up to a minute, and a promotion or demotion forgets
 * that at once. (Powers are checked fresh anyway, Person::fresh.)
 */
class EditorGrant extends Pivot
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_editor_site';

    public $incrementing = true;

    protected static function booted(): void
    {
        $forget = fn (self $grant) => Person::forgetGrant($grant->editor_id, $grant->site_id);
        static::saved($forget);
        static::deleted($forget);
    }
}
