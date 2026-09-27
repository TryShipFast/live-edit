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
     * How many image pixels to keep per CSS pixel of the box.
     *
     * The box is measured in the browser in CSS pixels, and most screens that
     * matter draw two device pixels for each of them. Fitted to the box exactly
     * the replacement is correct and looks soft on every phone and every recent
     * laptop, next to the template's own photographs which were not.
     *
     * Never an upscale: see density(). Two rather than three because the file
     * grows with the square of this and the returns stop being visible.
     */
    protected const DENSITY = 2;

    /**
     * Rewrite the file at $path so it fills a $width x $height box.
     *
     * The result has the box's shape and, where the original was big enough to
     * allow it, more pixels than the box has - see DENSITY.
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

        $density = self::density($width, $height, $sourceWidth, $sourceHeight);
        $width = (int) min(round($width * $density), self::MAX_EDGE);
        $height = (int) min(round($height * $density), self::MAX_EDGE);

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

    /**
     * How much bigger than the box we may go, given what the original holds.
     *
     * Bounded by the original in both directions, so the crop is always a
     * selection of real pixels. Enlarging a small photograph to fill a retina
     * box invents detail, costs bandwidth for it, and looks worse than the
     * honest smaller file the browser would have scaled itself.
     */
    protected static function density(int $width, int $height, int $sourceWidth, int $sourceHeight): float
    {
        if ($width < 1 || $height < 1) {
            return 1.0;
        }

        return max(1.0, min(
            (float) self::DENSITY,
            $sourceWidth / $width,
            $sourceHeight / $height
        ));
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
