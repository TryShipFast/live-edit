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

    /** Neither of these is something a caller should be able to ask for. */
    protected $hidden = ['secret_hash', 'public_text'];

    /** The person a session was issued to; nothing, for a site's own keys. */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(Editor::class, 'editor_id');
    }

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

    /**
     * Keep an active editor signed in.
     *
     * A session is short because it sits in a browser, but somebody writing
     * the copy for their own website is not a threat model — being thrown out
     * mid-sentence, with a dead key still in storage and no way back, is a
     * worse outcome than a key that lives a few hours while in use.
     *
     * So it slides while somebody is working, and still dies when they stop.
     * Capped from when it was issued, so a key taken out of a page cannot be
     * kept alive forever by using it.
     */
    public function renewIfActive(): void
    {
        if ($this->tokenType() !== TokenType::Session || $this->expires_at === null) {
            return;
        }

        $window = (int) config('live-edit.api.session_ttl', 7200);
        $ceiling = $this->created_at?->copy()->addSeconds((int) config('live-edit.api.session_max_life', 86400));

        // How much is LEFT, said in the direction that cannot be misread:
        // a signed difference from now, positive while it is still alive.
        $remaining = now()->diffInSeconds($this->expires_at, false);

        // Only once past halfway, so an editor saving every few seconds is not
        // writing to this row every time.
        if ($remaining > $window / 2) {
            return;
        }

        $extended = now()->addSeconds($window);

        if ($ceiling !== null && $extended->greaterThan($ceiling)) {
            $extended = $ceiling;
        }

        if ($extended->greaterThan($this->expires_at)) {
            $this->forceFill(['expires_at' => $extended])->saveQuietly();
        }
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
