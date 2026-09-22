<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

class ElementStyle extends Model
{
    protected $fillable = ['key', 'props'];

    protected function casts(): array
    {
        return ['props' => 'array'];
    }
}
