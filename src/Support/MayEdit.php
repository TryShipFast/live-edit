<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Gate;

/**
 * Whether whoever is looking at this page may edit it.
 *
 * Asked everywhere instead of Gate::allows('live-edit') directly, because the
 * gate alone gets one case wrong and it is the case a customer pays for.
 *
 * A host may define the gate themselves, and plenty should: an application
 * that already knows about editors and administrators can answer this far
 * better than a list in a config file. But a host writing that closure is
 * thinking about THEIR users, and the obvious closure asks for a signed-in
 * user of their application. Somebody who signed in with Live Edit is not one:
 * the control plane mints its own session and leaves auth()->user() null, so
 * the closure returns false and every licensed editor is refused.
 *
 * It fails in the worst possible shape. The developer who wrote the gate is
 * usually signed in to their own admin while testing, so the editor appears
 * for them and for nobody else - working locally, silently dead in
 * production, with nothing logged. That is exactly how it was found: a site
 * where the editor worked on .test and not on the live domain.
 *
 * So a valid control-plane session is honoured regardless of what the host
 * gate says, when the licence is configured to accept one. That is not
 * overriding the host's opinion about their own users - it is refusing to let
 * a closure about their users silently revoke a sign-in route the console
 * told the customer would work.
 *
 * A host who genuinely wants only their own people sets sign_in to "host",
 * which turns this off and leaves the gate the only answer.
 */
class MayEdit
{
    public static function check(): bool
    {
        return self::bySession() || Gate::allows('live-edit');
    }

    /**
     * Signed in with the control plane, where no account on this website is
     * involved at all.
     */
    public static function bySession(): bool
    {
        return (string) config('live-edit.sign_in', 'either') !== 'host'
            && EditorSession::check();
    }
}
