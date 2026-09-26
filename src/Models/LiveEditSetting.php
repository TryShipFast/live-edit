<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Somewhere for a site's words to live when the host has nowhere of its own.
 *
 * A host that already stores settings should keep using its own model — see
 * the config note — and the first paying install does. But the common case
 * for this package is an existing site that never had a settings table,
 * because until now its words were hardcoded in its templates. Requiring one
 * before anything can be saved turns "install the editor" back into a
 * development task.
 */
class LiveEditSetting extends Model
{
    protected $table = 'live_edit_settings';

    protected $guarded = [];

    public $timestamps = true;
}
