<?php

namespace ShipFast\LiveEdit\Application\Api;

use ShipFast\LiveEdit\Domain\Site\Ability;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;

/**
 * Hands a browser a key that can write, without ever handing it the key that
 * makes keys.
 *
 * The customer's server calls this with its secret, having already decided that
 * the person at the keyboard may edit. It has to be their decision: their users
 * are not ours, and we have no way to tell an editor from a visitor on someone
 * else's site. What comes back is short-lived and write-scoped, so a session
 * scraped out of a page stops working on its own.
 */
class IssueEditSession
{
    /**
     * @return array{token: string, expires_at: string, site: string}
     */
    /**
     * @param  bool  $mayEditLocked  Whether this person may edit the regions
     *                               the site's author marked data-live-lock.
     *                               The host decides: they know which of their
     *                               users this is and we have no way to.
     */
    public function __invoke(Site $site, ?string $label = null, ?int $ttlSeconds = null, bool $mayEditLocked = true): array
    {
        $ttl = $ttlSeconds ?? (int) config('live-edit.api.session_ttl', 1800);
        $expiresAt = now()->addSeconds(max(60, $ttl));

        [, $plain] = $site->issueToken(
            TokenType::Session,
            $label !== null && $label !== '' ? mb_substr($label, 0, 100) : 'Edit session',
            // Publish too, and deliberately.
            //
            // Holding edits back is only a safety net if the person who made
            // them can release them. On a site this application does not
            // render there is no other credential in the building: the button
            // is not there, and the ability was not either, so a static-site
            // client could edit for ever and never go live. That is the
            // flagship case.
            //
            // It is not the same as handing a browser the secret. A session is
            // short-lived, origin-bound, minted only for somebody who proved
            // they may edit this site, and cannot mint another — which is what
            // Ability::Mint exists to prevent.
            [Ability::Read, Ability::Write, Ability::Publish],
            $expiresAt,
            null,
            $mayEditLocked,
        );

        $this->forgetExpired($site);

        return [
            'token' => $plain,
            'expires_at' => $expiresAt->toIso8601String(),
            'site' => $site->slug,
        ];
    }

    /**
     * Expired sessions are useless but not harmless: left alone they grow
     * without bound, and a table of dead credentials is a table worth stealing.
     */
    private function forgetExpired(Site $site): void
    {
        ApiToken::query()
            ->where('site_id', $site->id)
            ->where('type', TokenType::Session->value)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now()->subDay())
            ->delete();
    }
}
