<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Style overrides for one element, belonging to one site.
 */
class SiteStyle extends Model
{
    protected $table = 'live_edit_site_styles';

    protected $guarded = [];

    protected $casts = ['props' => 'array'];
}
