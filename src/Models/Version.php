<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

class Version extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_versions';

    protected $fillable = ['site_id', 'number', 'locales', 'changes', 'restored_from', 'published_by'];

    protected function casts(): array
    {
        return ['locales' => 'array'];
    }
}
