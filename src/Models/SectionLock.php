<?php

namespace ShipFast\LiveEdit\Models;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

/** One person working on one part of one site. See Domain\Team\SectionLocks. */
class SectionLock extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_section_locks';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['claimed_at' => 'datetime', 'last_active_at' => 'datetime'];
    }
}
