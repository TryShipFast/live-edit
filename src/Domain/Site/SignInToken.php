<?php

namespace ShipFast\LiveEdit\Domain\Site;

use ShipFast\LiveEdit\Models\Concerns\OnTheConfiguredConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single use of a link sent to somebody's inbox.
 */
class SignInToken extends Model
{
    use OnTheConfiguredConnection;

    protected $table = 'live_edit_sign_in_tokens';

    protected $fillable = ['editor_id', 'site_id', 'token_hash', 'return_to', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    protected $hidden = ['token_hash'];

    /** The site this link is for, named on the link rather than inferred. */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'site_id');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(Editor::class, 'editor_id');
    }

    public function isUsable(): bool
    {
        return $this->used_at === null && $this->expires_at->isFuture();
    }
}
