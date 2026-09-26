<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Support\Facades\Hash;

/**
 * Signing in to edit, with a password.
 *
 * The other way in — a link sent by email — is the better idea and is kept:
 * there is nothing to choose, nothing to forget, and nothing in our database
 * worth stealing. This exists because it works today, on a site whose owner
 * wants to edit their own words before we have finished wiring up mail.
 *
 * The thing being protected is somebody's website copy, reached only from
 * pages that site already allows, by an address already registered as one of
 * its editors. That is worth saying plainly because it sets the bar: this
 * should be careful, not ceremonial.
 */
final class PasswordSignIn
{
    /**
     * Check an address and password, and mint a session if they are good.
     *
     * @return array{token: string, editor: Editor, expires_at: string}|null
     */
    public static function attempt(Site $site, string $email, string $password): ?array
    {
        $editor = Editor::query()
            ->where('site_id', $site->id)
            ->whereRaw('lower(email) = ?', [mb_strtolower(trim($email))])
            ->first();

        /*
         * Hash something even when there is no such editor.
         *
         * Checking a password takes real time by design, and returning early
         * when the address is unknown makes that time a signal: a fast no
         * means "nobody here", a slow one means "right address, wrong
         * password". That turns this into a way to ask which of a customer's
         * staff are real, which the emailed-link flow already refuses to
         * answer.
         */
        if ($editor === null || ! is_string($editor->password) || $editor->password === '') {
            Hash::check($password, '$2y$12$usesomethingthatwillneverbeamatchAAAAAAAAAAAAAAAAAAAAAAAAAAA');

            return null;
        }

        if (! Hash::check($password, $editor->password)) {
            return null;
        }

        // Kept current, so a hash written under an older cost factor is
        // upgraded the next time its owner signs in rather than never.
        if (Hash::needsRehash($editor->password)) {
            $editor->forceFill(['password' => Hash::make($password)])->save();
        }

        $editor->forceFill(['last_seen_at' => now()])->save();

        $expiresAt = now()->addSeconds(max(60, (int) config('live-edit.api.session_ttl', 1800)));

        [, $plain] = $site->issueToken(
            TokenType::Session,
            $editor->name ?: $editor->email,
            $editor->abilities(),
            $expiresAt,
            $editor->id,
        );

        return [
            'token' => $plain,
            'editor' => $editor,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    /**
     * Set or replace an editor's password.
     *
     * Here rather than in a controller so there is one place that decides
     * what a password has to be, and one place that hashes it.
     */
    public static function set(Editor $editor, string $password): void
    {
        $editor->forceFill(['password' => Hash::make($password)])->save();
    }
}
