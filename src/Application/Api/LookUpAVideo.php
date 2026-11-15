<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * A video from YouTube or Vimeo, read from the link an owner pasted (LIVE-EDIT-STRUCTURE.md, "A video from YouTube or
 * Vimeo").
 *
 * Only the players people know: YouTube (youtube.com/watch, youtu.be, shorts, embed, live) and Vimeo (vimeo.com/<id>,
 * an unlisted vimeo.com/<id>/<hash>, player.vimeo.com/video/<id>). Anything else is refused with the words the editor
 * says everywhere, NOT_A_VIDEO. The same reading as the editor's (resources/js/embed-links.js) and the host's.
 *
 * Its title and cover come from the service's own oEmbed (youtube.com/oembed, vimeo.com/api/oembed.json): the cover is
 * then fetched and made fit through the site's own image store (StoreMedia::fromAddress), so a published page never
 * loads a picture from YouTube or Vimeo before the visitor presses play. Where it cannot be stored (no site to keep it
 * for, a full storage, the service not answering), the cover is null and the page shows the video's title on the
 * template's own colours instead.
 */
class LookUpAVideo
{
    public const NOT_A_VIDEO = 'Paste a link to a YouTube or Vimeo video.';

    private const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'];

    private const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

    public function __construct(private readonly StoreMedia $store) {}

    /**
     * What a link is, or null: provider, id, hash (an unlisted Vimeo video's private part) and link (the video's own
     * page, the address it is saved under).
     *
     * @return array{provider: string, id: string, hash: ?string, link: string}|null
     */
    public static function videoOf(string $text): ?array
    {
        $said = trim($text);

        if ($said === '' || strlen($said) > 2000) {
            return null;
        }

        if (preg_match('#^[a-z][a-z0-9+.-]*:#i', $said) !== 1) {
            $said = 'https://'.$said;
        }

        $parts = parse_url($said);

        if (! is_array($parts) || ! in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true) || empty($parts['host'])) {
            return null;
        }

        $host = strtolower($parts['host']);
        $path = array_values(array_filter(explode('/', (string) ($parts['path'] ?? '')), fn ($p) => $p !== ''));
        parse_str((string) ($parts['query'] ?? ''), $query);

        if (in_array($host, self::YOUTUBE_HOSTS, true)) {
            $id = match (true) {
                $host === 'youtu.be' => $path[0] ?? null,
                ($path[0] ?? null) === 'watch' => is_string($query['v'] ?? null) ? $query['v'] : null,
                in_array($path[0] ?? null, ['shorts', 'embed', 'live', 'v'], true) => $path[1] ?? null,
                default => null,
            };

            if (! is_string($id) || preg_match('/^[A-Za-z0-9_-]{11}$/', $id) !== 1) {
                return null;
            }

            return ['provider' => 'youtube', 'id' => $id, 'hash' => null, 'link' => 'https://www.youtube.com/watch?v='.$id];
        }

        if (in_array($host, self::VIMEO_HOSTS, true)) {
            $id = null;
            $hash = null;

            if ($host === 'player.vimeo.com') {
                $id = ($path[0] ?? null) === 'video' ? ($path[1] ?? null) : null;
            } else {
                foreach ($path as $i => $part) {
                    if (preg_match('/^\d+$/', $part) === 1) {
                        $id = $part;
                        $next = $path[$i + 1] ?? null;
                        $hash = is_string($next) && preg_match('/^[0-9a-f]{6,20}$/i', $next) === 1 ? $next : null;

                        break;
                    }
                }
            }

            $hash ??= is_string($query['h'] ?? null) ? $query['h'] : null;

            if (! is_string($id) || preg_match('/^\d{1,12}$/', $id) !== 1) {
                return null;
            }

            if ($hash !== null && preg_match('/^[0-9a-f]{6,20}$/i', $hash) !== 1) {
                $hash = null;
            }

            return ['provider' => 'vimeo', 'id' => $id, 'hash' => $hash, 'link' => 'https://vimeo.com/'.$id.($hash !== null ? '/'.$hash : '')];
        }

        return null;
    }

    /**
     * The video a link is, with its title and its cover stored as the site's own picture.
     *
     * @return array{provider: string, id: string, link: string, title: string, cover: ?string}|null  Null for a link that is not a video.
     */
    public function __invoke(?Site $site, string $link): ?array
    {
        $video = self::videoOf($link);

        if ($video === null) {
            return null;
        }

        $said = $this->oEmbed($video);
        $title = trim(preg_replace('/\s+/u', ' ', (string) ($said['title'] ?? '')) ?? '');
        $cover = null;

        if ($site !== null) {
            foreach ($this->covers($video, $said) as $address) {
                FindPhotos::offer($address);
                $stored = rescue(fn () => $this->store->fromAddress($site, $address, 1280, 720, true), null, false);

                if (is_array($stored) && is_string($stored['url'] ?? null)) {
                    $cover = $stored['url'];

                    break;
                }
            }
        }

        return [
            'provider' => $video['provider'],
            'id' => $video['id'],
            'link' => $video['link'],
            'title' => mb_substr($title !== '' ? $title : ($video['provider'] === 'youtube' ? 'YouTube video' : 'Vimeo video'), 0, 200),
            'cover' => $cover,
        ];
    }

    /**
     * What the service says about the video (its title and picture), or [] when it does not answer.
     *
     * @param  array{provider: string, id: string, hash: ?string, link: string}  $video
     * @return array<string, mixed>
     */
    private function oEmbed(array $video): array
    {
        $address = $video['provider'] === 'youtube'
            ? 'https://www.youtube.com/oembed?'.http_build_query(['url' => $video['link'], 'format' => 'json'])
            : 'https://vimeo.com/api/oembed.json?'.http_build_query(['url' => $video['link'], 'width' => 1280]);

        try {
            $response = Http::connectTimeout(4)->timeout(8)->acceptJson()->get($address);
        } catch (\Throwable) {
            return [];
        }

        $json = $response->successful() ? $response->json() : null;

        return is_array($json) ? $json : [];
    }

    /**
     * The pictures that may be its cover, best first: YouTube's large one (1280 wide, there for most videos), then the
     * one its oEmbed names. Only the services' own picture hosts.
     *
     * @param  array{provider: string, id: string}  $video
     * @param  array<string, mixed>  $said
     * @return list<string>
     */
    private function covers(array $video, array $said): array
    {
        $covers = [];

        if ($video['provider'] === 'youtube') {
            $covers[] = 'https://i.ytimg.com/vi/'.$video['id'].'/maxresdefault.jpg';
        }

        $named = is_string($said['thumbnail_url'] ?? null) ? $said['thumbnail_url'] : '';
        $host = strtolower((string) parse_url($named, PHP_URL_HOST));

        if (str_starts_with($named, 'https://') && in_array($host, ['i.ytimg.com', 'img.youtube.com', 'i.vimeocdn.com'], true)) {
            $covers[] = $named;
        }

        return array_values(array_unique($covers));
    }
}
