<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Http\UploadedFile;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * An uploaded picture, stored and given back as an address.
 *
 * The caller receives a URL and never a key. A key is what the disk is asked
 * for; a URL is what a page fetches, and a remote site has no disk to ask. The
 * two are kept apart deliberately — storing a URL where a key belongs works
 * until the first caller that needs a key, which tends to be months later.
 */
class StoreMedia
{
    public function __construct(private readonly ImageStore $images) {}

    /**
     * @return array{url: string, path: string}
     */
    public function __invoke(Site $site, UploadedFile $file, ?int $fitWidth = null, ?int $fitHeight = null): array
    {
        $path = $this->images->store($file, $fitWidth, $fitHeight);

        return ['url' => $this->images->url($path), 'path' => $path];
    }
}
