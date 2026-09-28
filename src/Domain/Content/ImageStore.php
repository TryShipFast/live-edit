<?php

namespace ShipFast\LiveEdit\Domain\Content;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Support\ImageFitter;
use ShipFast\LiveEdit\Support\SvgSanitiser;

/**
 * Putting an uploaded picture somewhere, safely and at the right size.
 *
 * Worth being precise about one thing, because it decides the order of
 * everything here: an image is fitted while it is still a local temporary
 * file, never after it has been stored.
 *
 * The fitter needs a real file on disk. When the disk was local, a stored
 * path was one, so fitting afterwards worked. On S3 the same call returns a
 * key rather than a path, the fitter finds no file, and returns false — so
 * the picture is stored at whatever size it arrived, the section it sits in
 * stretches, and nothing anywhere reports a problem. The design a client paid
 * for is quietly spoiled by moving a bucket.
 *
 * An upload is always a local temp file, whatever the destination, so that is
 * where the work happens.
 */
class ImageStore
{
    /** What a browser may send, and what the fitter can actually read. */
    public const ALLOWED = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];

    /**
     * @return string the stored path or key — never a URL
     *
     * @throws ValidationException
     */
    public function store(UploadedFile $file, ?int $fitWidth = null, ?int $fitHeight = null, ?string $directory = null): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: '');

        if (! in_array($extension, self::ALLOWED, true)) {
            throw ValidationException::withMessages([
                'file' => 'That file type is not accepted. Use a JPG, PNG, GIF, WebP, AVIF or SVG.',
            ]);
        }

        $maxKilobytes = (int) config('live-edit.max_upload_kb', 8192);

        if ($file->getSize() > $maxKilobytes * 1024) {
            throw ValidationException::withMessages([
                'file' => 'That image is too large. The limit is '.round($maxKilobytes / 1024, 1).'MB.',
            ]);
        }

        // A site's own folder when one is given, so one customer's pictures
        // are never mixed with another's — and so removing a site can remove
        // its files.
        $directory ??= $this->directory();

        if ($extension === 'svg') {
            return $this->storeSvg($file, $directory);
        }

        // Before storing, while there is still a real file to work on.
        if ($fitWidth !== null && $fitHeight !== null && $fitWidth > 0 && $fitHeight > 0) {
            ImageFitter::fit($file->getRealPath(), $fitWidth, $fitHeight);
        }

        // Stored with the headers a CDN needs, at the moment it is written.
        // An object in a bucket is served by the CDN without passing through
        // this application again, so anything not said here cannot be said
        // later — a picture without a cache header is re-fetched by every
        // visitor for the life of the site.
        return Storage::disk($this->disk())->putFile($directory, $file, $this->objectOptions($file->getMimeType()));
    }

    /**
     * The address a page should use for a stored image.
     *
     * A CDN in front of the bucket is the whole point of putting images there:
     * the file is served from an edge near the visitor rather than from one
     * region, and never from this application. Setting media_url points at the
     * distribution; without it the disk answers for itself, which is right for
     * a local install.
     */
    public function url(string $path): string
    {
        $base = rtrim((string) config('live-edit.media_url', ''), '/');

        return $base !== '' ? $base.'/'.ltrim($path, '/') : Storage::disk($this->disk())->url($path);
    }

    /**
     * Keep bytes we already hold, rather than a file somebody uploaded.
     *
     * A generated picture arrives as bytes in an HTTP response, with no file
     * on any disk to wrap in an UploadedFile. It still has to be stored, for
     * the same reason an upload does: what goes into a page must be an address
     * the page can fetch, and the alternative is carrying the whole picture
     * around as a data: URI, which is how an image nobody can save happens.
     *
     * @param  string  $extension  Without the dot.
     */
    public function put(string $bytes, string $mime, string $extension, ?string $directory = null): string
    {
        $directory = trim($directory ?: (string) config('live-edit.media_directory', 'live-edit'), '/');
        $path = $directory.'/'.bin2hex(random_bytes(16)).'.'.ltrim($extension, '.');

        Storage::disk($this->disk())->put($path, $bytes, $this->objectOptions($mime));

        return $path;
    }

    /**
     * What is stored alongside the bytes.
     *
     * The name is random, so a given URL is that picture forever — replacing
     * an image writes a new object rather than overwriting one. That is what
     * makes a year-long immutable cache safe, and it is what stops every
     * visitor paying for the same image twice.
     *
     * @return array<string, string>
     */
    private function objectOptions(?string $mime = null): array
    {
        $options = ['CacheControl' => 'public, max-age=31536000, immutable'];

        return $mime !== null && $mime !== '' ? $options + ['ContentType' => $mime] : $options;
    }

    /**
     * An SVG is a document, not a picture: it can carry script, fetch remote
     * resources and run handlers. It is rebuilt from an allow-list before it
     * is stored, so what lands in the bucket is already safe — a file served
     * straight from a CDN is never passed through anything again.
     */
    private function storeSvg(UploadedFile $file, string $directory): string
    {
        $clean = SvgSanitiser::clean((string) file_get_contents($file->getRealPath()));

        if (trim($clean) === '') {
            throw ValidationException::withMessages(['file' => 'That SVG could not be read.']);
        }

        $path = $directory.'/'.bin2hex(random_bytes(16)).'.svg';

        // The type is stored explicitly: a bucket guessing this wrong serves
        // an SVG as something a browser will not render, or worse, will.
        Storage::disk($this->disk())->put($path, $clean, $this->objectOptions('image/svg+xml'));

        return $path;
    }

    private function disk(): string
    {
        return config('live-edit.disk', 'public');
    }

    private function directory(): string
    {
        return trim((string) config('live-edit.directory', 'live-edit'), '/');
    }
}
