<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

/**
 * One site's use of the service in one month.
 */
class SiteUsage extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_site_usage';

    protected $fillable = ['site_id', 'period', 'writes', 'publishes', 'uploads', 'tags', 'bytes_added'];

    protected $casts = [
        'writes' => 'integer',
        'publishes' => 'integer',
        'uploads' => 'integer',
        'tags' => 'integer',
        'bytes_added' => 'integer',
    ];
}
