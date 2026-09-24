<?php

namespace ShipFast\LiveEdit\Tests\Fixtures;

use Illuminate\Contracts\Filesystem\Filesystem;

/**
 * A faked disk that answers path() the way a bucket does.
 *
 * Storage::fake('s3') is a local directory wearing an S3 name: it has a real
 * path() pointing at a real file, so any bug that depends on a remote disk
 * NOT having one is invisible to it. A test using the plain fake passed
 * whether the code was right or wrong, which is worse than no test.
 *
 * The real S3 adapter returns the object key from path() — a string that is
 * not a file on this machine. That single difference is what this reproduces.
 */
class RemoteLikeDisk
{
    public function __construct(private readonly Filesystem $inner) {}

    /** A key, not a location: nothing local can open this. */
    public function path(string $path): string
    {
        return $path;
    }

    public function __call(string $method, array $arguments): mixed
    {
        return $this->inner->{$method}(...$arguments);
    }
}
