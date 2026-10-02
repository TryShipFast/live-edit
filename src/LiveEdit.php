<?php

namespace ShipFast\LiveEdit;

/**
 * What this release is called.
 *
 * One number, in one place, because three things have to agree about it and
 * until now none of them did. The engine was released nine times while the
 * WordPress plugin's header sat at 0.12.0, so the download handed customers
 * current code wearing an old version - and WordPress, which decides whether
 * an update exists by comparing that header, was never going to offer one.
 *
 * A test asserts the plugin's header matches this. Releasing without bumping
 * both fails the build, which is the only arrangement that has ever held on
 * this project: every version of "remember to also update X" has eventually
 * not been remembered.
 */
final class LiveEdit
{
    public const VERSION = '0.13.27';
}
