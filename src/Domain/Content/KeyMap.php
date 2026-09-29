<?php

namespace ShipFast\LiveEdit\Domain\Content;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;

/**
 * What each element of one page was last called.
 *
 * @property int $site_id
 * @property string $page
 * @property string $fingerprint
 * @property array<string, string> $map
 */
class KeyMap extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_key_maps';

    protected $guarded = [];

    protected $casts = ['map' => 'array'];
}
