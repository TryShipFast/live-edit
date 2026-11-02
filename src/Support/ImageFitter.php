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
    /**
     * @param  array{x: int, y: int, width: int, height: int}|null  $crop
     *                                                                     The part of the picture to keep, in the source file's own pixels.
     *                                                                     Null takes the middle, which is right until it is not: a face or a
     *                                                                     product off to one side is exactly what the middle cuts off, and that
     *                                                                     single failure is the whole reason a client ever wants a crop tool.
     */
    public static function fit(string $path, int $width, int $height, bool $exact = false, ?array $crop = null): bool
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

        // A phone's sideways photograph is measured the way it is turned upright (read() turns it).
        if ($info[2] === IMAGETYPE_JPEG && in_array(self::orientation($path), [5, 6, 7, 8], true)) {
            [$sourceWidth, $sourceHeight] = [$sourceHeight, $sourceWidth];
        }

        /*
         * `$exact` means the caller measured the picture being replaced rather
         * than the box it sits in.
         *
         * The density multiplier exists because a box is measured in the
         * browser in CSS pixels and most screens draw two device pixels for
         * each. An image's own width is already device pixels, so doubling it
         * would store a file twice the size of the one it replaced - which is
         * the opposite of fitting what was there.
         */
        $chosen = self::chosen($crop, $sourceWidth, $sourceHeight);

        /*
         * Density is judged against the part being kept, not the whole file.
         *
         * A 6000px photograph cropped to a 400px corner has 400px to give,
         * and asking for twice the box from it would upscale that corner -
         * which density() exists to refuse. Measuring the crop is what keeps
         * that refusal true once a client is choosing the crop themselves.
         */
        $density = $exact
            ? 1.0
            : self::density($width, $height, $chosen === null ? $sourceWidth : $chosen['width'], $chosen === null ? $sourceHeight : $chosen['height']);

        $width = (int) min(round($width * $density), self::MAX_EDGE);
        $height = (int) min(round($height * $density), self::MAX_EDGE);

        $source = self::read($path, $info[2]);
        if ($source === null) {
            return false;
        }

        if ($chosen !== null) {
            // Exactly what was chosen, scaled to the spot. The shape is the
            // spot's because the rectangle was drawn in the spot's shape.
            ['x' => $cropX, 'y' => $cropY, 'width' => $cropWidth, 'height' => $cropHeight] = $chosen;
        } else {
            // Scale so the image covers the box, then take the middle of it.
            $scale = max($width / $sourceWidth, $height / $sourceHeight);
            $cropWidth = (int) round($width / $scale);
            $cropHeight = (int) round($height / $scale);
            $cropX = (int) round(($sourceWidth - $cropWidth) / 2);
            $cropY = (int) round(($sourceHeight - $cropHeight) / 2);
        }

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
    /**
     * Any uploaded photograph made fit for a web page: upright, no larger than a page shows it, saved at web quality.
     *
     * Owner, 2 Nov 2026: "the images are 5MB each and there's no backend image resize happening". Only a picture
     * replacing one on the page was fitted (to its box); a logo, a background, a share image or a new product's
     * photo went up as the camera made it, 4000px and 5MB, and every visitor downloaded it whole. So every stored
     * picture is turned the way the camera held it, scaled down so its longest side is at most $maxEdge (2400:
     * twice a wide 1200px column, sharp on any screen), and saved again at quality 82, kept only where that is
     * smaller. Never enlarged; a GIF (it may move) and an SVG are left alone.
     */
    public static function shrink(string $path, int $maxEdge = 2400): bool
    {
        if (! extension_loaded('gd') || ! is_file($path)) {
            return false;
        }

        $info = @getimagesize($path);
        if ($info === false || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            return false;
        }

        [$width, $height] = $info;
        $before = (int) @filesize($path);
        $turned = $info[2] === IMAGETYPE_JPEG && self::orientation($path) > 1;
        $scale = min(1.0, $maxEdge / max($width, $height, 1));

        // Already small, upright and light: nothing to gain.
        if ($scale >= 1.0 && ! $turned && $before < 400 * 1024) {
            return false;
        }

        $source = self::read($path, $info[2]);
        if ($source === null) {
            return false;
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min(1.0, $maxEdge / max($width, $height, 1));
        $target = $source;

        if ($scale < 1.0) {
            $target = imagecreatetruecolor((int) round($width * $scale), (int) round($height * $scale));
            imagealphablending($target, false);
            imagesavealpha($target, true);
            imagecopyresampled($target, $source, 0, 0, 0, 0, imagesx($target), imagesy($target), $width, $height);
        }

        $temporary = $path.'.web';
        $written = match ($info[2]) {
            IMAGETYPE_JPEG => @imagejpeg($target, $temporary, 82),
            IMAGETYPE_PNG => @imagepng($target, $temporary, 9),
            IMAGETYPE_WEBP => function_exists('imagewebp') && @imagewebp($target, $temporary, 82),
        };

        if ($target !== $source) {
            imagedestroy($target);
        }
        imagedestroy($source);

        // Kept when it is smaller, or when it had to be turned or scaled to be right at all.
        if ($written && is_file($temporary) && ($scale < 1.0 || $turned || filesize($temporary) < $before)) {
            return @rename($temporary, $path);
        }

        @unlink($temporary);

        return false;
    }

    /** The EXIF orientation a camera wrote (1 is upright), or 1 where there is none to read. */
    protected static function orientation(string $path): int
    {
        if (! function_exists('exif_read_data')) {
            return 1;
        }

        $exif = @exif_read_data($path);

        return is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;
    }

    protected static function read(string $path, int $type)
    {
        $image = self::readAsStored($path, $type);

        // A phone keeps its photograph sideways and says which way up it goes; drawn as stored, it came out lying on
        // its side once it was resized (the browser turns the original, but a resized copy has no EXIF to say so).
        if ($image !== null && $type === IMAGETYPE_JPEG) {
            $image = match (self::orientation($path)) {
                3 => imagerotate($image, 180, 0),
                6 => imagerotate($image, -90, 0),
                8 => imagerotate($image, 90, 0),
                default => $image,
            } ?: $image;
        }

        return $image;
    }

    protected static function readAsStored(string $path, int $type)
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

    /**
     * A chosen rectangle, forced inside the picture it was chosen from.
     *
     * Clamped rather than refused. The numbers are measured in a browser from
     * an image that may have been scaled to fit a panel, so a rectangle that
     * ends a pixel or two past the edge is rounding rather than an attack -
     * and a crop refused at save time, after somebody has carefully framed it,
     * is a worse answer than one nudged back inside.
     *
     * Null when there is nothing usable, which puts the middle back.
     *
     * @param  array{x?: int, y?: int, width?: int, height?: int}|null  $crop
     * @return array{x: int, y: int, width: int, height: int}|null
     */
    protected static function chosen(?array $crop, int $sourceWidth, int $sourceHeight): ?array
    {
        if ($crop === null) {
            return null;
        }

        $x = max(0, min((int) ($crop['x'] ?? 0), $sourceWidth - 1));
        $y = max(0, min((int) ($crop['y'] ?? 0), $sourceHeight - 1));
        $width = (int) ($crop['width'] ?? 0);
        $height = (int) ($crop['height'] ?? 0);

        if ($width < 1 || $height < 1) {
            return null;
        }

        $width = min($width, $sourceWidth - $x);
        $height = min($height, $sourceHeight - $y);

        return $width < 1 || $height < 1 ? null : compact('x', 'y', 'width', 'height');
    }
}
