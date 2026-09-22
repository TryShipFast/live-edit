<?php

namespace ShipFast\LiveEdit\Tests\Fixtures;

use Illuminate\Database\Eloquent\Model;

class Widget extends Model
{
    protected $fillable = ['sort', 'title', 'body', 'icon', 'image'];

    public $timestamps = false;
}
