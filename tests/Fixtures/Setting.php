<?php

namespace ShipFast\LiveEdit\Tests\Fixtures;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public $timestamps = false;
}
