<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One value, belonging to one site.
 *
 * @property int $site_id
 */
class SiteSetting extends Model
{
    protected $table = 'live_edit_site_settings';

    protected $guarded = [];
}
