<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A stored key: what it may do, until when, and a hash of the secret.
 *
 * @property array<int, string> $abilities
 */
class ApiToken extends Model
{
    protected $table = 'live_edit_api_tokens';

    protected $guarded = [];

    protected $casts = [
        'abilities' => 'array',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    /** The secret hash is not something a caller should be able to ask for. */
    protected $hidden = ['secret_hash'];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    public function tokenType(): TokenType
    {
        return TokenType::from($this->type);
    }

    public function isUsable(): bool
    {
        return $this->revoked_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    public function can(Ability $ability): bool
    {
        return Ability::grantedIn($this->abilities ?? [], $ability);
    }

    public function revoke(): void
    {
        $this->forceFill(['revoked_at' => now()])->save();
    }

    /**
     * Record use, but not on every request.
     *
     * "When was this key last used" is worth knowing; paying a write on every
     * read to know it to the second is not. A minute's resolution answers the
     * question it is actually asked for — is this key still in use — without
     * putting a database write in front of cached content.
     */
    public function touchUsage(): void
    {
        if ($this->last_used_at !== null && $this->last_used_at->diffInSeconds(now()) < 60) {
            return;
        }

        $this->forceFill(['last_used_at' => now()])->saveQuietly();
    }
}
