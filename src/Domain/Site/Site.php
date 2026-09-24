<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'suspended_at' => 'datetime',
    ];

    public function tokens(): HasMany
    {
        return $this->hasMany(ApiToken::class, 'site_id');
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
            'abilities' => array_map(fn (Ability $a) => $a->value, $abilities ?? $type->defaultAbilities()),
            'expires_at' => $expiresAt,
        ]);

        return [$token, $value->plain()];
    }
}
