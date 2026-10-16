<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

class Draft extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_drafts';

    // site_id first and deliberately: left out of this list, mass
    // assignment drops it without a word, the row is written with no
    // owner, and every scoped query then fails to find it. Nothing
    // errors — the draft simply ceases to exist for the site that made it.
    protected $fillable = ['site_id', 'kind', 'subject', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
