<?php

namespace ShipFast\LiveEdit\Domain\Credits;

use Illuminate\Database\Eloquent\Model;

/**
 * One line of the ledger: credits given, or credits spent.
 *
 * @property int $site_id
 * @property int $delta
 * @property string $reason
 * @property array<string, mixed>|null $meta
 */
class CreditEntry extends Model
{
    protected $table = 'live_edit_credit_entries';

    protected $guarded = [];

    protected $casts = ['meta' => 'array'];
}
