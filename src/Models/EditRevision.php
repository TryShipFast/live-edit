<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

class EditRevision extends Model
{
    use OnTheConfiguredConnection;

    protected $fillable = ['batch', 'action', 'subject', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
