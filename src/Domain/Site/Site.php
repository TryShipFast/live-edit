<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use ShipFast\LiveEdit\Domain\Content\SiteSnapshot;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SiteSetting;
use ShipFast\LiveEdit\Models\SiteStyle;
use ShipFast\LiveEdit\Models\Version;

/**
 * A customer's site: the thing a key belongs to and content is scoped by.
 *
 * @property string $slug
 * @property array<int, string> $allowed_origins
 */
class Site extends Model
{
    protected $table = 'live_edit_sites';

    protected $guarded = [];

    protected $casts = [
        'allowed_origins' => 'array',
        'limits' => 'array',
        'bytes_stored' => 'integer',
        'suspended_at' => 'datetime',
        'last_active_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    /**
     * Whether this site has proved it holds the domain it registered.
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null && trim((string) $this->domain) !== '';
    }

    /**
     * Whether a hostname is the one this site's licence was bought for.
     *
     * An unverified site matches nothing. That is the whole point: a licence
     * naming a domain nobody proved they hold should not let anybody in under
     * that name, least of all the person who typed it.
     */
    public function ownsDomain(?string $host): bool
    {
        return $this->isVerified() && SiteVerification::covers((string) $this->domain, $host);
    }

    /**
     * The people allowed to edit this site.
     *
     * Many to many in both directions and that is the point: one person edits
     * several sites (an agency), and one site is edited by several people
     * (the agency and the client whose site it is, who wants to change their
     * own phone number without asking anybody).
     */
    public function editors(): BelongsToMany
    {
        return $this->belongsToMany(Editor::class, 'live_edit_editor_site', 'site_id', 'editor_id')
            ->withPivot(['may_publish', 'last_seen_at'])
            ->withTimestamps();
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(ApiToken::class, 'site_id');
    }

    /**
     * A removed site takes its content with it.
     *
     * The tables cascade, but only where the database is enforcing foreign
     * keys — which SQLite does not by default, and neither do some MySQL
     * configurations. Leaving one customer's words behind after they have
     * gone is not a tidiness problem; it is data nobody has a right to hold.
     * So it is done here as well, where nothing has to be switched on.
     */
    protected static function booted(): void
    {
        static::deleting(function (self $site) {
            // Their published files too. A departed customer's words sitting
            // in a bucket are data nobody has a right to hold, and a CDN would
            // happily keep serving them.
            rescue(fn () => (new SiteSnapshot(new SiteStore($site)))->forget(), null, false);

            SiteSetting::query()->where('site_id', $site->id)->delete();
            SiteStyle::query()->where('site_id', $site->id)->delete();
            Draft::query()->where('site_id', $site->id)->delete();
            Version::query()->where('site_id', $site->id)->delete();
            ApiToken::query()->where('site_id', $site->id)->delete();
        });
    }

    public function originPolicy(): OriginPolicy
    {
        return new OriginPolicy($this->allowed_origins ?? []);
    }

    public function isActive(): bool
    {
        return $this->suspended_at === null;
    }

    /**
     * Whether this site still holds a licence key that works.
     *
     * Not "has a key": a key that expired last month is a lapsed licence, and
     * a revoked one is a rotated or withdrawn licence. What matters is
     * whether any of them is alive right now.
     *
     * The distinction this draws is deliberate. Rotating a key revokes the
     * old one and issues a new one, and must not throw an editor out
     * mid-sentence; a licence running out must. So it asks whether ANY usable
     * licence key remains, which is true through a rotation and false once
     * the last one lapses.
     *
     * Sessions are excluded because they are not licences. One is minted per
     * sign-in and lives hours, so counting them would mean a site stayed
     * licensed for as long as somebody kept editing it.
     *
     * A site that has never been issued a licence key at all is treated as
     * live, and that is the same rule the packages follow on the other side:
     * nothing configured means carry on. Reading "never had one" as "lapsed"
     * would stop editing on every site that predates keys having an expiry,
     * which is a licence decision made by accident.
     */
    public function hasLiveLicence(): bool
    {
        $licences = $this->tokens()
            ->whereIn('type', [TokenType::Publishable->value, TokenType::Secret->value]);

        if ((clone $licences)->doesntExist()) {
            return true;
        }

        return $licences
            ->whereNull('revoked_at')
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->exists();
    }

    /**
     * Mint a key. The plain text comes back once, here and nowhere else — it is
     * not recoverable afterwards, by us or by anyone who reads the database.
     *
     * @param  array<int, Ability>|null  $abilities
     * @return array{0: ApiToken, 1: string}
     */
    public function issueToken(TokenType $type, string $name, ?array $abilities = null, ?\DateTimeInterface $expiresAt = null, ?int $editorId = null): array
    {
        $value = TokenValue::generate($type);

        $token = $this->tokens()->create([
            'public_id' => $value->id,
            // Only a session has a person behind it; the site's own keys
            // belong to the site.
            'editor_id' => $editorId,
            'type' => $type->value,
            'name' => $name,
            'secret_hash' => $value->hash(),
            // Kept readable only for the key that is printed into every page
            // of the site anyway. Hashing that one protected nothing and meant
            // we could not tell a site what its own key was.
            'public_text' => $type === TokenType::Publishable ? $value->plain() : null,
            'abilities' => array_map(fn (Ability $a) => $a->value, $abilities ?? $type->defaultAbilities()),
            'expires_at' => $expiresAt,
        ]);

        return [$token, $value->plain()];
    }
}
