<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Http\UploadedFile;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Content\SiteStore;
use ShipFast\LiveEdit\Domain\Site\Meter;
use ShipFast\LiveEdit\Domain\Site\OverLimit;
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
    public function __invoke(Site $site, UploadedFile $file, ?int $fitWidth = null, ?int $fitHeight = null, bool $fitExact = false, ?array $crop = null): array
    {
        // Into this site's own folder. Random names already make a collision
        // impossible; separate folders make a customer's files identifiable,
        // and removable when they leave.
        $bytes = (int) $file->getSize();

        // Checked before the file is written, not after: refusing an upload
        // that is already in the bucket costs the storage anyway.
        if (! Meter::allows($site, Meter::UPLOAD, $bytes)) {
            throw new OverLimit('This site has reached its storage limit.');
        }

        $path = $this->images->store($file, $fitWidth, $fitHeight, (new SiteStore($site))->mediaDirectory(), $fitExact, $crop);

        Meter::record($site, Meter::UPLOAD, $bytes);

        return ['url' => $this->images->url($path), 'path' => $path];
    }
}
