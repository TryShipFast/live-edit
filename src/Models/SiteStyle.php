<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

/**
 * Style overrides for one element, belonging to one site.
 */
class SiteStyle extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_site_styles';

    protected $guarded = [];

    protected $casts = ['props' => 'array'];
}
