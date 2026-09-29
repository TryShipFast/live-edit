<?php

namespace ShipFast\LiveEdit\Support;

/**
 * Whether this installation keeps its own content, or we do.
 *
 * One question, asked in one place, because it was being answered by
 * accident in several. A site configured with a cloud host and site has its
 * words kept by the service: the page is served our runtime, which tags the
 * markup in the browser and fetches content over the API. Nothing in that
 * arrangement involves the host's database.
 *
 * The cost of not having this: an API-driven Laravel frontend installed the
 * package, and code that had no business reading a local settings table read
 * one anyway. There was no such table on that server, and a live site
 * answered 500 on every page - twice, because the first fix guarded one
 * reader and the next one along was not guarded either.
 *
 * Guarding each read was treating the symptom. The site's owner asked the
 * right question - why is a cloud install reading local settings at all -
 * and the answer is that it should not be.
 */
final class WhereTheWordsLive
{
    /** With the service, rather than in this application's own database. */
    public static function withTheService(): bool
    {
        return filled(config('live-edit.cloud.site'))
            && filled(config('live-edit.cloud.host'));
    }

    /** In this application's own database, which is the default. */
    public static function here(): bool
    {
        return ! self::withTheService();
    }
}
