<?php

namespace ShipFast\LiveEdit\Domain\Site;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use ShipFast\LiveEdit\Mail\SignInLink;

/**
 * Letting a site's own people in, without asking them to keep a password.
 *
 * A link to an inbox rather than a password, because a password on a service
 * like this is a liability we would be storing on a customer's behalf and a
 * reset flow we would have to get right. A link is short-lived, single use, and
 * proves the same thing: whoever opened it reads that mailbox.
 */
class SignIn
{
    /**
     * Send a link, if there is anybody here to send it to.
     *
     * Returns nothing and says nothing either way. Answering differently for a
     * known and an unknown address turns this into a way to ask which of your
     * customers' staff exist.
     */
    public static function request(Site $site, string $email, string $returnTo): void
    {
        // Checked here, where the link is made — never where it is clicked. A
        // return address taken on trust at the far end is an open redirect,
        // and one that arrives by email, from us, looking entirely legitimate.
        if (! $site->originPolicy()->permits(self::originOf($returnTo))) {
            return;
        }

        $editor = Editor::query()
            ->where('site_id', $site->id)
            ->whereRaw('lower(email) = ?', [mb_strtolower(trim($email))])
            ->first();

        if ($editor === null || ! $site->isActive()) {
            return;
        }

        $plain = bin2hex(random_bytes(32));

        SignInToken::query()->create([
            'editor_id' => $editor->id,
            'token_hash' => hash('sha256', $plain),
            'return_to' => $returnTo,
            'expires_at' => now()->addMinutes((int) config('live-edit.api.sign_in_ttl', 15)),
        ]);

        // Any earlier link for this person stops working. Asking again should
        // mean the last one is the only one alive.
        SignInToken::query()
            ->where('editor_id', $editor->id)
            ->whereNull('used_at')
            ->where('token_hash', '!=', hash('sha256', $plain))
            ->update(['used_at' => now()]);

        self::send($editor, $site, $plain);
    }

    /**
     * Turn a clicked link into a key the browser can use.
     *
     * @return array{token: string, return_to: string, expires_at: string}|null
     */
    public static function redeem(string $plain): ?array
    {
        $record = SignInToken::query()
            ->with('editor.site')
            ->where('token_hash', hash('sha256', $plain))
            ->first();

        if ($record === null || ! $record->isUsable()) {
            return null;
        }

        $editor = $record->editor;
        $site = $editor?->site;

        if ($editor === null || $site === null || ! $site->isActive()) {
            return null;
        }

        // Single use, marked before the key is issued: a link forwarded to
        // somebody else, or replayed from a mailbox later, is spent.
        $record->forceFill(['used_at' => now()])->save();
        $editor->forceFill(['last_seen_at' => now()])->save();

        $expiresAt = now()->addSeconds(max(60, (int) config('live-edit.api.session_ttl', 1800)));

        [, $plainToken] = $site->issueToken(
            TokenType::Session,
            $editor->name ?: $editor->email,
            $editor->abilities(),
            $expiresAt,
            $editor->id,
        );

        return [
            'token' => $plainToken,
            'return_to' => $record->return_to,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    private static function send(Editor $editor, Site $site, string $plain): void
    {
        $mail = new SignInLink(
            $editor,
            $site,
            URL::to('/live-edit/sign-in/'.$plain),
            (int) config('live-edit.api.sign_in_ttl', 15),
        );

        // Never fatal. A mail server having a bad minute should not turn into
        // a 500 for the person asking, and the token is already stored — they
        // can simply ask again.
        rescue(fn () => Mail::to($editor->email)->send($mail), null, false);
    }

    private static function originOf(string $url): ?string
    {
        $parts = parse_url($url);

        if (! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        return $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}
