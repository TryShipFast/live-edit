<?php

namespace ShipFast\LiveEdit\Domain\Site;

use SensitiveParameter;

/**
 * Turns a presented string into a site and a key, or a reason it is not one.
 *
 * Every check lives here rather than in the middleware, because these are rules
 * about keys and not about HTTP: the same answers hold for a queued job, a
 * console command or a second transport later.
 */
class TokenAuthenticator
{
    public function authenticate(
        #[SensitiveParameter] ?string $presented,
        ?string $origin = null,
        ?Ability $needs = null,
    ): AuthenticationResult {
        if ($presented === null || trim($presented) === '') {
            return AuthenticationResult::denied(Denial::Missing);
        }

        $value = TokenValue::parse($presented);

        if ($value === null) {
            return AuthenticationResult::denied(Denial::Malformed);
        }

        $token = ApiToken::query()->with('site')->where('public_id', $value->id)->first();

        if ($token === null) {
            // Hash anyway. Answering "no such key" faster than "wrong secret"
            // would let someone learn which ids exist purely from the clock.
            $value->matches(str_repeat('0', 64));

            return AuthenticationResult::denied(Denial::Unknown);
        }

        if (! $value->matches($token->secret_hash) || $token->tokenType() !== $value->type) {
            return AuthenticationResult::denied(Denial::Mismatched);
        }

        if ($token->revoked_at !== null) {
            return AuthenticationResult::denied(Denial::Revoked);
        }

        /*
         * An expired LICENCE key still reads.
         *
         * The rule further down says a lapsed licence costs the editor and
         * never the website, and means it. This check fired first and denied
         * everything, so on a static site — the one adapter where we hold the
         * content — a lapse took every word the customer had ever published
         * off their live page and put the template's original text back. The
         * site stayed up saying somebody else's words.
         *
         * Billing pauses editing by dating these keys, so that is not a
         * hypothetical path: it is what happens to anybody whose card fails.
         *
         * Only expiry, and only a licence key. A REVOKED key is still refused
         * outright, because revoking is what you do to a key that has leaked
         * and it must stop being useful for anything. A session token that has
         * expired is still refused too: that is a person's credential with a
         * lifetime of its own, and it has nothing to do with whether the site
         * is paid for.
         */
        $expiredLicence = $token->expires_at !== null
            && $token->expires_at->isPast()
            && in_array($token->tokenType(), [TokenType::Publishable, TokenType::Secret], true);

        if (! $token->isUsable() && ! $expiredLicence) {
            return AuthenticationResult::denied(Denial::Expired);
        }

        $site = $token->site;

        if ($site === null || ! $site->isActive()) {
            return AuthenticationResult::denied(Denial::SiteSuspended);
        }

        // An Origin header means a browser sent this. A secret key arriving
        // that way is already compromised — it is in a page — so it is refused
        // rather than honoured.
        $fromBrowser = $origin !== null && $origin !== '';

        if ($fromBrowser && ! $token->tokenType()->allowedFromBrowser()) {
            return AuthenticationResult::denied(Denial::SecretInBrowser);
        }

        if ($fromBrowser && ! $site->originPolicy()->permits($origin)) {
            return AuthenticationResult::denied(Denial::OriginNotAllowed);
        }

        if ($needs !== null && ! $token->can($needs)) {
            return AuthenticationResult::denied(Denial::MissingAbility);
        }

        /*
         * A lapsed licence stops writing, whichever key is presented.
         *
         * Last, so the more specific refusals answer first. A key offered to
         * the wrong site should hear that it is the wrong site, not that the
         * licence has lapsed: the second is true of that site and tells the
         * caller nothing about what they actually did.
         *
         * The checks above only ask about the credential in hand, so a
         * sign-in session minted an hour ago kept working after the site's
         * licence ran out: it is neither revoked nor expired itself. The
         * editor would disappear on the next page load and anybody already
         * editing could carry on saving until their session ran down.
         *
         * Reading is left alone. A site's published words belong on its
         * pages whatever its billing is doing, and taking a customer's
         * website down over a licence is the one thing this product promises
         * not to do.
         */
        if ($needs !== null && $needs !== Ability::Read && ! $site->hasLiveLicence()) {
            return AuthenticationResult::denied(Denial::LicenceLapsed);
        }

        return AuthenticationResult::allowed($token, $site);
    }
}
