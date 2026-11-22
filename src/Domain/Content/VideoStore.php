<?php

namespace ShipFast\LiveEdit\Domain\Content;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/** Store only browser-playable video formats with an explicit video MIME type. */
class VideoStore
{
    public function store(UploadedFile $file, ?string $directory = null): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: '');
        $mime = strtolower((string) $file->getMimeType());
        $allowed = ['mp4' => 'video/mp4', 'webm' => 'video/webm'];

        if (! isset($allowed[$extension]) || $mime !== $allowed[$extension]) {
            throw ValidationException::withMessages(['file' => 'Choose an MP4 or WebM video.']);
        }

        $limit = (int) config('live-edit.max_video_upload_kb', 102400);
        if ($file->getSize() > $limit * 1024) {
            throw ValidationException::withMessages(['file' => 'That video is too large. The limit is '.round($limit / 1024).'MB.']);
        }

        $directory = trim($directory ?: (string) config('live-edit.media_directory', 'live-edit'), '/');
        $path = Storage::disk(config('live-edit.disk', 'public'))->putFile($directory, $file, [
            'CacheControl' => 'public, max-age=31536000, immutable',
            'ContentType' => $mime,
        ]);

        if ($path === false || $path === '') {
            throw new RuntimeException('The video could not be stored. Check the configured media disk.');
        }

        return $path;
    }

    public function url(string $path): string
    {
        $base = rtrim((string) config('live-edit.media_url', ''), '/');

        return $base !== '' ? $base.'/'.ltrim($path, '/') : Storage::disk(config('live-edit.disk', 'public'))->url($path);
    }
}
