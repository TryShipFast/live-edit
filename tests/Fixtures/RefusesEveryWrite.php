<?php

namespace ShipFast\LiveEdit\Tests\Fixtures;

use Illuminate\Contracts\Filesystem\Filesystem;

/**
 * A disk that fails the way a real one fails: quietly.
 *
 * Laravel configures disks with `throw => false`, and both disks a fresh
 * application ships with have it. So a write that cannot be made does not
 * raise anything - it returns false, and a caller that does not check gets a
 * false where a path should be and carries on.
 *
 * `Storage::fake()` on its own can never reproduce that: it is a local
 * directory that always succeeds. Without this, the code that trusted the
 * return value passed every test and failed on a real host.
 */
class RefusesEveryWrite
{
    public function __construct(private readonly Filesystem $inner) {}

    public function putFile(...$arguments): bool
    {
        return false;
    }

    public function put(...$arguments): bool
    {
        return false;
    }

    public function __call(string $method, array $arguments): mixed
    {
        return $this->inner->{$method}(...$arguments);
    }
}
