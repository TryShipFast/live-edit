<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;

class Draft extends Model
{
    protected $table = 'live_edit_drafts';

    protected $fillable = ['kind', 'subject', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
