<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

/**
 * One value, belonging to one site.
 *
 * @property int $site_id
 */
class SiteSetting extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_site_settings';

    protected $guarded = [];
}
