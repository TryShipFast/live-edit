<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

class ImageGeneration extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_image_generations';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['images' => 'array', 'balance' => 'integer'];
    }
}
