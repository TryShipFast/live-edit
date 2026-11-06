<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
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
    private const MAX_REMOTE_IMAGE_BYTES = 12 * 1048576;

    public function __construct(private readonly ImageStore $images) {}

    /**
     * @return array{url: string, path: string}
     */
    public function __invoke(Site $site, UploadedFile $file, ?int $fitWidth = null, ?int $fitHeight = null, bool $fitExact = false, ?array $crop = null, bool $logo = false): array
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

        $path = $this->images->store($file, $fitWidth, $fitHeight, (new SiteStore($site))->mediaDirectory(), $fitExact, $crop, $logo);

        Meter::record($site, Meter::UPLOAD, $bytes);

        return ['url' => $this->images->url($path), 'path' => $path];
    }

    /**
     * A free photo chosen in the editor, stored as the site's own picture: fetched from the photo service, made fit
     * for a page and served from the site's own storage. Openverse hands out the original file (often a camera's 5MB);
     * saved as its address it was served whole, from someone else's server, to every visitor (owner, 2 Nov 2026: "the
     * images are 5MB each"). Only an address a search offered in the last hour (FindPhotos::offered); null when it
     * cannot be fetched, and the caller keeps the address as before.
     *
     * @return array{url: string, path: string}|null
     */
    public function fromAddress(Site $site, string $address, ?int $fitWidth = null, ?int $fitHeight = null, bool $fitExact = false): ?array
    {
        if (! FindPhotos::offered($address)) {
            return null;
        }

        $local = tempnam(sys_get_temp_dir(), 'photo-');

        if ($local === false) {
            return null;
        }

        $tooLarge = false;
        $maxBytes = min(self::MAX_REMOTE_IMAGE_BYTES, (int) config('live-edit.max_upload_kb', 8192) * 1024);

        try {
            $response = Http::connectTimeout(5)
                ->timeout(30)
                ->withOptions([
                    'sink' => $local,
                    // Do not buffer a camera original in PHP memory. Abort
                    // it once it reaches the configured upload-size limit.
                    'progress' => static function ($downloadTotal, $downloaded) use (&$tooLarge, $maxBytes): void {
                        if ($downloaded > $maxBytes) {
                            $tooLarge = true;
                            throw new \RuntimeException('The remote image exceeds the configured processing limit.');
                        }
                    },
                ])
                ->get($address);

            $type = strtolower(explode(';', (string) $response->header('Content-Type'))[0]);
            $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$type] ?? null;

            if (! $response->successful() || $extension === null || ! is_file($local) || filesize($local) < 1) {
                return null;
            }
            if (filesize($local) > $maxBytes) {
                throw ValidationException::withMessages([
                    'file' => 'That photograph is larger than this site accepts. Choose a smaller image and try again.',
                ]);
            }

            return $this($site, new UploadedFile($local, 'photo.'.$extension, $type, null, true), $fitWidth, $fitHeight, $fitExact);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable) {
            if ($tooLarge) {
                throw ValidationException::withMessages([
                    'file' => 'That photograph is larger than this site accepts. Choose a smaller image and try again.',
                ]);
            }

            return null;
        } finally {
            @unlink($local);
        }
    }
}
