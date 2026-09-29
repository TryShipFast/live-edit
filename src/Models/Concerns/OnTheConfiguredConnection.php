<?php

namespace ShipFast\LiveEdit\Models\Concerns;

/**
 * Put this package's tables on whichever connection the host names.
 *
 * Every model here used the application's DEFAULT connection, with no way to
 * say otherwise. That is fine right up until it is not, and the case that
 * breaks it is ordinary: an application whose own models all name a
 * connection explicitly, leaving the default pointing somewhere nobody uses.
 * Nothing notices, because nothing uses it - until this package arrives and
 * becomes the first thing to read from it.
 *
 * Met on a live site on 2026-09-29. learnkasts installed the engine, the very
 * first request asked the default connection for `live_edit_settings`, the
 * default was a SQLite file that does not exist on that server, and every
 * page on the site answered 500. The site had been working for months; the
 * default connection had been wrong for just as long and had never been
 * asked for anything.
 *
 * So the host can say. `LIVE_EDIT_DB_CONNECTION=mysql` and this package's
 * tables go there, whatever the application's default happens to be.
 *
 * Null keeps the old behaviour exactly - Eloquent's own resolution, the
 * default connection - so nothing already working changes.
 */
trait OnTheConfiguredConnection
{
    public function getConnectionName(): ?string
    {
        $named = config('live-edit.connection');

        return filled($named) ? (string) $named : parent::getConnectionName();
    }
}
