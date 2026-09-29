<?php

namespace ShipFast\LiveEdit\Domain\Site;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Someone who may edit. A person, not a person-on-one-site.
 *
 * The address identifies them, once, across every site they work on: the
 * people who edit websites for a living edit several, and an agency with
 * thirty clients should not be thirty accounts for one person, each with its
 * own password to forget.
 *
 * What they may DO is held per site, on the grant, because trusting somebody
 * to publish on your own marketing page says nothing about whether they may
 * publish on your client's.
 */
class Editor extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_editors';

    protected $fillable = ['email', 'name', 'password'];

    /**
     * Never serialised, never logged, never returned by an endpoint.
     *
     * Hidden rather than merely "not selected anywhere": the day somebody
     * returns an Editor from a controller is the day a hash goes over the
     * wire, and that is not a mistake worth leaving available.
     */
    protected $hidden = ['password'];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    /** The sites this person has been given access to. */
    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'live_edit_editor_site', 'editor_id', 'site_id')
            ->withPivot(['may_publish', 'last_seen_at'])
            ->withTimestamps();
    }

    /**
     * Whether this person may edit that site at all.
     *
     * Asked before a password is ever checked. Being a known person and being
     * allowed on a particular site are two questions, and collapsing them is
     * how one agency's editor ends up in another agency's client's pages.
     */
    public function mayEdit(Site $site): bool
    {
        return $this->grantOn($site) !== null;
    }

    public function mayPublishOn(Site $site): bool
    {
        return (bool) ($this->grantOn($site)?->pivot->may_publish ?? false);
    }

    /**
     * What a session minted for this person on this site is allowed to do.
     *
     * Takes the site, because the answer is different on each one. Reading
     * publish rights off the person was only ever correct while a person had
     * exactly one site.
     */
    public function abilities(Site $site): array
    {
        $abilities = [Ability::Read, Ability::Write];

        // Publishing is normally kept from a browser because a customer's own
        // server vouched for whoever is holding the key, and we cannot see
        // past that. Here the sign-in was ours: we know who this is, so the
        // decision can be theirs to make.
        if ($this->mayPublishOn($site)) {
            $abilities[] = Ability::Publish;
        }

        return $abilities;
    }

    /** Record that they were here, on this site and not on the others. */
    public function sawOn(Site $site): void
    {
        $this->sites()->updateExistingPivot($site->id, ['last_seen_at' => now()]);
    }

    private function grantOn(Site $site): ?Site
    {
        return $this->sites()->whereKey($site->id)->first();
    }
}
