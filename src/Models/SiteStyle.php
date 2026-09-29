<?php

namespace ShipFast\LiveEdit\Models;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;

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
