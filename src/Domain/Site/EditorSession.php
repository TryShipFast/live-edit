<?php

namespace ShipFast\LiveEdit\Domain\Site;

/**
 * Starting an editing session, once, however the person proved who they are.
 *
 * There are three ways in and they are deliberately different at the front: a
 * password, a link sent to an inbox, and being already signed in to the
 * console as the site's owner. Behind all three the answer is the same
 * sentence, and it had been written out twice before this existed and was
 * about to be written a third time.
 *
 * What it does is small and easy to get subtly wrong in a copy: the expiry
 * has a floor, the abilities come from the grant on THIS site rather than from
 * the person, and the token is tied to the editor so that removing them from a
 * site can revoke what they are holding. A copy that forgot the last of those
 * would leave somebody editing after they had been taken off.
 *
 * Proving who somebody is stays with the callers. This is only what happens
 * afterwards, and it assumes that question is already settled.
 */
final class EditorSession
{
    /**
     * @return array{token: string, editor: Editor, expires_at: string}
     */
    public static function begin(Site $site, Editor $editor): array
    {
        $editor->forceFill(['last_seen_at' => now()])->save();
        $editor->sawOn($site);

        $expiresAt = now()->addSeconds(max(60, (int) config('live-edit.api.session_ttl', 1800)));

        [, $plain] = $site->issueToken(
            TokenType::Session,
            $editor->name ?: $editor->email,
            // From the grant on this site, never from the person. Trusting
            // somebody to publish on your own page says nothing about whether
            // they may publish on your client's.
            $editor->abilities($site),
            $expiresAt,
            $editor->id,
        );

        return [
            'token' => $plain,
            'editor' => $editor,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }
}
