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
 * The role is "owner", "admin" or "editor". The owner (the first person on
 * the site) and any admin they made may take over somebody else's section,
 * throw away changes somebody left behind, put back a teammate's change and
 * restore a whole version; an editor may not (mayManage).
 *
 * Owner, 5 Nov 2026: "the first person to open is the admin, but can also add
 * other team member as admin or someone can be promoted to admin".
 *
 * A role change takes effect on the person's next request. Who-is-editing
 * reads remember a person for at most a minute (and are forgotten at once when
 * a grant changes, EditorGrant), but every action that needs the power asks
 * the database again (fresh()), so a demoted admin loses it at once.
 */
final class Person
{
    public const OWNER = 'owner';

    public const ADMIN = 'admin';

    public const EDITOR = 'editor';

    public const ROLES = [self::OWNER, self::ADMIN, self::EDITOR];

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

        $known = Cache::remember(self::cacheKey((string) $token->public_id), 60, fn () => self::lookUp($token));

        return new self('e'.$token->editor_id, self::nameOrDefault($known['name'] ?? null), self::role($known['role'] ?? null));
    }

    /**
     * The same answer, asked of the database now. For anything that needs the
     * power (take over, throw away, restore, put back a teammate's change), so
     * a demotion counts on the very next request. The token itself was read
     * fresh by the key check on those routes, so a host-minted role is current.
     */
    public static function fresh(ApiToken $token): self
    {
        if (filled($token->holder_ref) || $token->editor_id === null) {
            return self::fromToken($token);
        }

        $known = self::lookUp($token);
        Cache::put(self::cacheKey((string) $token->public_id), $known, 60);

        return new self('e'.$token->editor_id, self::nameOrDefault($known['name'] ?? null), self::role($known['role'] ?? null));
    }

    public static function cacheKey(string $publicId): string
    {
        return 'live-edit.team.person.'.$publicId;
    }

    /** Forget who the holders of this editor's sessions on this site are, after their grant changed. */
    public static function forgetGrant(int|string|null $editorId, int|string|null $siteId): void
    {
        if ($editorId === null || $siteId === null) {
            return;
        }

        ApiToken::query()->where('editor_id', $editorId)->where('site_id', $siteId)->pluck('public_id')
            ->each(fn ($id) => Cache::forget(self::cacheKey((string) $id)));
    }

    /** @return array{name: ?string, role: ?string} */
    private static function lookUp(ApiToken $token): array
    {
        $editor = $token->editor()->first();
        $grantRole = $editor?->sites()->where('live_edit_sites.id', $token->site_id)->first()?->pivot?->role;
        $email = (string) ($editor?->email ?? '');

        return [
            'name' => $editor?->name ?: ($email !== '' ? explode('@', $email)[0] : $token->name),
            // The grant is the truth for somebody we know; a role given when the
            // session began is only used where the grant has none.
            'role' => $grantRole ?: $token->holder_role,
        ];
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

    /** The owner or an admin: may take over, throw away left changes, put back a teammate's change, restore. */
    public function mayManage(): bool
    {
        return $this->role === self::OWNER || $this->role === self::ADMIN;
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

    public static function role(?string $role): string
    {
        return in_array($role, self::ROLES, true) ? $role : self::EDITOR;
    }
}
