<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

class Version extends Model
{
    protected $table = 'live_edit_versions';

    protected $fillable = ['site_id', 'number', 'locales', 'changes', 'restored_from', 'published_by'];

    protected function casts(): array
    {
        return ['locales' => 'array'];
    }
}
