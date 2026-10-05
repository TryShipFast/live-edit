<?php

namespace ShipFast\LiveEdit\Domain\Content;

use Illuminate\Database\Eloquent\Model;
use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;

/**
 * The keys one page keeps behind a lock.
 *
 * @property int $site_id
 * @property string $page
 * @property array<int, string> $keys
 */
class LockedKeys extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_locked_keys';

    protected $guarded = [];

    protected $casts = ['keys' => 'array'];
}
