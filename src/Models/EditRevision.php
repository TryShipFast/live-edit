<?php

namespace ShipFast\LiveEdit\Models;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;

class EditRevision extends Model
{
    use OnTheConfiguredConnection;

    protected $fillable = ['batch', 'action', 'subject', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
