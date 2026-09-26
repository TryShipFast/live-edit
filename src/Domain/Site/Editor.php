<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Someone who may edit one site.
 */
class Editor extends Model
{
    protected $table = 'live_edit_editors';

    protected $fillable = ['site_id', 'email', 'name', 'may_publish', 'password'];

    /**
     * Never serialised, never logged, never returned by an endpoint.
     *
     * Hidden rather than merely "not selected anywhere": the day somebody
     * returns an Editor from a controller is the day a hash goes over the
     * wire, and that is not a mistake worth leaving available.
     */
    protected $hidden = ['password'];

    protected $casts = [
        'may_publish' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    /** What a session minted for this person is allowed to do. */
    public function abilities(): array
    {
        $abilities = [Ability::Read, Ability::Write];

        // Publishing is normally kept from a browser because a customer's own
        // server vouched for whoever is holding the key, and we cannot see
        // past that. Here the sign-in was ours: we know who this is, so the
        // decision can be theirs to make.
        if ($this->may_publish) {
            $abilities[] = Ability::Publish;
        }

        return $abilities;
    }
}
