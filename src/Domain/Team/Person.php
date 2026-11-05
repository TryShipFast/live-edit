<?php

namespace ShipFast\LiveEdit\Domain\Team;

use Illuminate\Support\Facades\Cache;
use ShipFast\LiveEdit\Domain\Site\ApiToken;

/**
 * Who is at the keyboard, as far as team editing is concerned.
 *
 * Three answers, in this order:
 *
 *   - a person the host named when it minted the session (holder_ref): the
 *     host knows its own users and we believe it, the same way we already
 *     believe it about may_edit_locked;
 *   - an editor we know (editor_id): somebody invited to the site, signed in
 *     with us or started by the host through EditorSession::begin;
 *   - nobody: the site's own keys (publishable, secret) and every session
 *     minted before this existed. That caller is "the website" itself and is
 *     treated exactly as before team editing: it owns everything, holds no
 *     locks and publishes everything. This is what keeps a single-editor site
 *     working the way it always has.
 *
 * The role is "owner" or "editor". Only the owner may take over somebody
 * else's section or throw away changes somebody left behind.
 */
final class Person
{
    public const OWNER = 'owner';

    public const EDITOR = 'editor';

    public function __construct(
        public readonly ?string $id,
        public readonly string $name,
        public readonly string $role,
    ) {}

    public static function theWebsite(): self
    {
        return new self(null, 'The website', self::OWNER);
    }

    /**
     * Read once per token and remembered for a few minutes, so a poll does not
     * pay a query to learn who is asking. A rename or a change of role shows
     * within that time; the token's own columns never change after minting.
     */
    public static function fromToken(ApiToken $token): self
    {
        if (filled($token->holder_ref)) {
            return new self(
                'h:'.mb_substr((string) $token->holder_ref, 0, 100),
                self::nameOrDefault($token->holder_name),
                self::role($token->holder_role),
            );
        }

        if ($token->editor_id === null) {
            return self::theWebsite();
        }

        $known = Cache::remember('live-edit.team.person.'.$token->public_id, 300, function () use ($token) {
            $editor = $token->editor;
            $grantRole = $editor?->sites()->where('live_edit_sites.id', $token->site_id)->first()?->pivot?->role;
            $email = (string) ($editor?->email ?? '');

            return [
                'name' => $editor?->name ?: ($email !== '' ? explode('@', $email)[0] : $token->name),
                'role' => $token->holder_role ?: $grantRole,
            ];
        });

        return new self('e'.$token->editor_id, self::nameOrDefault($known['name'] ?? null), self::role($known['role'] ?? null));
    }

    /** Somebody in particular, rather than the website asking about itself. */
    public function isSomeone(): bool
    {
        return $this->id !== null;
    }

    public function isOwner(): bool
    {
        return $this->role === self::OWNER;
    }

    /** @return array{id: ?string, name: string, role: string} */
    public function toArray(): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'role' => $this->role];
    }

    private static function nameOrDefault(?string $name): string
    {
        $name = trim((string) $name);

        return $name === '' ? 'A team member' : mb_substr($name, 0, 120);
    }

    private static function role(?string $role): string
    {
        return $role === self::OWNER ? self::OWNER : self::EDITOR;
    }
}
