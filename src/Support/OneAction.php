<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Str;

/**
 * Which edits belong to the same thing somebody did.
 *
 * Undo takes back an action, not a field. Replacing a picture writes the
 * source, the description, the title and the photographer's name - four
 * settings from one press of Save - and taking back only the last of them
 * would leave a photograph on the page with somebody else's name under it.
 * So writes are grouped, and the group is what undo removes.
 *
 * The group has to be one request. The editor's own controller worked that out
 * long ago and does it properly, with a note about why it cannot live on the
 * controller instance: route objects cache those, so under Octane or in tests
 * two people's edits would merge into one batch.
 *
 * The API did not. It used `'api:' . $site . ':' . $token`, which is the same
 * string for every edit that key will ever make - so every change ever saved
 * through it was one batch, and undo took back the client's entire history in
 * a single press. Reported from a real site as "a revert reverts all the
 * changes instead of the one you wanted", which is exactly what it did.
 *
 * One implementation, used by both ways in. Two implementations of one rule is
 * how a self-hosted site and a cloud one come to behave differently, and this
 * is the second time that has bitten this week.
 */
final class OneAction
{
    private const HELD = 'live-edit-batch';

    /**
     * The batch every write in this request belongs to.
     *
     * Kept on the request rather than in a static, so it cannot outlive the
     * request that made it. A static would be correct under PHP-FPM and wrong
     * under anything that keeps the process alive between requests, which is
     * the failure that is impossible to reproduce locally.
     */
    public static function id(): string
    {
        $request = request();

        $batch = $request->attributes->get(self::HELD);

        if ($batch === null) {
            $batch = (string) Str::uuid();
            $request->attributes->set(self::HELD, $batch);
        }

        return (string) $batch;
    }

    /**
     * The same, with who made it written in front.
     *
     * The prefix is worth keeping: it is what tells somebody reading the table
     * that a row came through the API rather than the editor, and which key
     * made it. It just cannot be the whole of the batch.
     */
    public static function by(string $site, string $token): string
    {
        return 'api:'.$site.':'.$token.':'.self::id();
    }
}
