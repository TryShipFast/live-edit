<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

class ElementStyle extends Model
{
    use OnTheConfiguredConnection;

    protected $fillable = ['key', 'props'];

    protected function casts(): array
    {
        return ['props' => 'array'];
    }
}
