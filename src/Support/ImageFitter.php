<?php

namespace ShipFast\LiveEdit\Support;

/**
 * Fits a replacement image to the box the original occupied.
 *
 * A client replacing a photo in a bought template rarely has one the right
 * shape. Dropped in as-is, a tall portrait where a wide banner used to be
 * stretches the layout and the design the template was bought for is gone.
 * So the new image is scaled to cover the original's box and centre-cropped:
 * it fills the same space exactly, keeps its proportions, and loses only the
 * edges that would not have been visible anyway.
 */
class ImageFitter
{
    /** Guard against absurd targets; a page box is never this large. */
    protected const MAX_EDGE = 4000;

    /**
     * Rewrite the file at $path so it exactly fills $width x $height.
     *
     * Returns false when the file is not an image type we can process, in
     * which case the original is left untouched rather than corrupted.
     */
    public static function fit(string $path, int $width, int $height): bool
    {
        if (! extension_loaded('gd') || ! is_file($path)) {
            return false;
        }

        $width = (int) min(max($width, 1), self::MAX_EDGE);
        $height = (int) min(max($height, 1), self::MAX_EDGE);

        $info = @getimagesize($path);
        if ($info === false) {
            return false;
        }

        [$sourceWidth, $sourceHeight] = $info;
        $source = self::read($path, $info[2]);
        if ($source === null) {
            return false;
        }

        // Scale so the image covers the box, then take the middle of it.
        $scale = max($width / $sourceWidth, $height / $sourceHeight);
        $cropWidth = (int) round($width / $scale);
        $cropHeight = (int) round($height / $scale);
        $cropX = (int) round(($sourceWidth - $cropWidth) / 2);
        $cropY = (int) round(($sourceHeight - $cropHeight) / 2);

        $target = imagecreatetruecolor($width, $height);
        // Keep transparency for formats that have it.
        imagealphablending($target, false);
        imagesavealpha($target, true);

        imagecopyresampled($target, $source, 0, 0, $cropX, $cropY, $width, $height, $cropWidth, $cropHeight);

        $written = self::write($target, $path, $info[2]);

        imagedestroy($source);
        imagedestroy($target);

        return $written;
    }

    /** @return \GdImage|null */
    protected static function read(string $path, int $type)
    {
        $image = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_GIF => @imagecreatefromgif($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        return $image === false ? null : $image;
    }

    protected static function write($image, string $path, int $type): bool
    {
        return match ($type) {
            IMAGETYPE_JPEG => @imagejpeg($image, $path, 86),
            IMAGETYPE_PNG => @imagepng($image, $path, 6),
            IMAGETYPE_GIF => @imagegif($image, $path),
            IMAGETYPE_WEBP => function_exists('imagewebp') ? @imagewebp($image, $path, 86) : false,
            default => false,
        };
    }
}
