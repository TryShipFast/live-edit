<?php

namespace ShipFast\LiveEdit\Domain\Content;

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
    protected $table = 'live_edit_key_maps';

    protected $guarded = [];

    protected $casts = ['map' => 'array'];
}
