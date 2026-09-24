<?php

namespace ShipFast\LiveEdit\Support;

use Aws\CloudFront\UrlSigner;
use Illuminate\Support\Facades\Storage;

/**
 * Addresses for published content.
 *
 * A snapshot is stored as a KEY and addressed as a URL, and the two must not be
 * confused: the key is what the disk is asked for, the URL is what a consumer
 * fetches. Storing a URL where a key belongs works until the first caller that
 * needs a key, which is the sort of thing that only surfaces months later.
 * Nothing here ever writes a URL back into storage.
 *
 * A bucket serving published content can be public — it is a website. Where it
 * is not, and CloudFront signing is configured, the URL is signed instead. The
 * signer is optional: without the AWS SDK or the keys, the plain URL is
 * returned rather than failing, because a public distribution is the ordinary
 * case.
 */
class SnapshotUrl
{
    /**
     * The address a consumer should fetch, signed when the distribution
     * requires it.
     *
     * The argument is a path WITHIN the snapshot directory — "current.json",
     * "v5/en.json" — not a disk key. The configured URL already addresses that
     * directory, and passing a full key produced the directory twice.
     */
    public static function for(string $relative, int $ttlSeconds = 3600): ?string
    {
        $url = self::plain($relative);

        if ($url === null) {
            return null;
        }

        return self::sign($url, $ttlSeconds) ?? $url;
    }

    /** The unsigned address, from the CDN if configured or the disk if not. */
    public static function plain(string $relative): ?string
    {
        $relative = ltrim($relative, '/');
        $base = rtrim((string) config('live-edit.snapshot_url', ''), '/');

        if ($base !== '') {
            return $base.'/'.$relative;
        }

        // Only here does the storage prefix come back, because a disk URL is
        // addressed by key rather than by the directory the CDN points at.
        $disk = Storage::disk(
            config('live-edit.snapshot_disk', config('live-edit.disk', 'local'))
        );
        $key = trim((string) config('live-edit.snapshot_directory', 'live-edit/content'), '/').'/'.$relative;

        return method_exists($disk, 'url') ? rescue(fn () => $disk->url($key), null, false) : null;
    }

    /**
     * Sign a CloudFront URL, or null when signing is not configured or
     * possible. Never throws: an unsigned public URL is the normal case.
     */
    public static function sign(string $url, int $ttlSeconds = 3600): ?string
    {
        $keyPairId = (string) config('live-edit.cloudfront.key_pair_id');
        $privateKey = self::privateKey();

        if ($keyPairId === '' || $privateKey === null || ! class_exists(UrlSigner::class)) {
            return null;
        }

        return rescue(
            fn () => (new UrlSigner($keyPairId, $privateKey))->getSignedUrl($url, time() + max(60, $ttlSeconds)),
            null,
            false
        );
    }

    /**
     * The PEM contents, or a readable path to them. The signer accepts either,
     * so a host with no persistent disk can supply the key inline.
     */
    protected static function privateKey(): ?string
    {
        $inline = trim((string) config('live-edit.cloudfront.private_key'));

        if ($inline !== '') {
            // Environment variables flatten newlines; the PEM parser needs them.
            return str_contains($inline, '\n') ? str_replace('\n', "\n", $inline) : $inline;
        }

        $path = (string) config('live-edit.cloudfront.private_key_path');

        return $path !== '' && is_file($path) ? $path : null;
    }
}
