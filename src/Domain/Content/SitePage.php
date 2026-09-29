<?php

namespace ShipFast\LiveEdit\Domain\Content;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;

/**
 * One page of one site that somebody has opened for editing.
 *
 * A record rather than a cache: what a plan allows is counted from these, so
 * losing them would hand somebody a fresh allowance.
 */
class SitePage extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_site_pages';

    protected $guarded = [];

    protected $casts = [
        'first_edited_at' => 'datetime',
        'last_edited_at' => 'datetime',
    ];
}
