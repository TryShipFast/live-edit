<?php

namespace ShipFast\LiveEdit\Models;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;

class ElementStyle extends Model
{
    use OnTheConfiguredConnection;

    protected $fillable = ['key', 'props'];

    protected function casts(): array
    {
        return ['props' => 'array'];
    }
}
