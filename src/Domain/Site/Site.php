<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Database\Eloquent\Model;
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
    ];

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
     * Mint a key. The plain text comes back once, here and nowhere else — it is
     * not recoverable afterwards, by us or by anyone who reads the database.
     *
     * @param  array<int, Ability>|null  $abilities
     * @return array{0: ApiToken, 1: string}
     */
    public function issueToken(TokenType $type, string $name, ?array $abilities = null, ?\DateTimeInterface $expiresAt = null): array
    {
        $value = TokenValue::generate($type);

        $token = $this->tokens()->create([
            'public_id' => $value->id,
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
