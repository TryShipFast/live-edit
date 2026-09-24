<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One site's use of the service in one month.
 */
class SiteUsage extends Model
{
    protected $table = 'live_edit_site_usage';

    protected $fillable = ['site_id', 'period', 'writes', 'publishes', 'uploads', 'bytes_added'];

    protected $casts = [
        'writes' => 'integer',
        'publishes' => 'integer',
        'uploads' => 'integer',
        'bytes_added' => 'integer',
    ];
}
