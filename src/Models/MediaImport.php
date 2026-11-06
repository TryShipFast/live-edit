<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

class MediaImport extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_media_imports';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['options' => 'array'];
    }
}
