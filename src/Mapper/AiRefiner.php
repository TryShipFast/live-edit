<?php

namespace ShipFast\LiveEdit\Mapper;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Optional LLM pass over the deterministic scanner output. The scanner does
 * the exhaustive, reliable *detection*; this refines *interpretation* —
 * semantic key names and human labels — which a heuristic can't do well.
 *
 * It never invents or drops elements: it only rewrites the key/label of the
 * candidates the scanner already found, and any failure falls straight back
 * to the deterministic result. Provider-agnostic via config (OpenAI-shaped
 * chat-completions by default); the API key is read from the environment.
 */
class AiRefiner
{
    /**
     * Its own switch, not the one that means "we sell AI features".
     *
     * This read live-edit.ai.enabled, which also gates the editor's rewrite
     * and image generation. Turning that off to stop paying for pictures
     * would have quietly changed what a tagging plan came back with, and the
     * two events are far enough apart that nobody would have connected them.
     */
    public function enabled(): bool
    {
        return (bool) config('live-edit.ai.mapper', false)
            && filled(config('live-edit.ai.api_key'));
    }

    /**
     * @param  array<int, array<string, mixed>>  $candidates
     * @return array<int, array<string, mixed>>
     */
    public function refine(array $candidates): array
    {
        if (! $this->enabled() || $candidates === []) {
            return $candidates;
        }

        // Batch so a large page never overflows the model's response — each
        // chunk fails independently, leaving its items on the deterministic key.
        $size = max(1, (int) config('live-edit.ai.batch', 25));

        foreach (array_chunk($candidates, $size, true) as $chunk) {
            try {
                $suggestions = $this->ask($chunk);
            } catch (Throwable) {
                continue;
            }

            foreach ($suggestions as $index => $suggestion) {
                if (! isset($candidates[$index])) {
                    continue;
                }
                if (! empty($suggestion['key'])) {
                    $candidates[$index]['key'] = $this->uniqueKey($this->sanitiseKey($suggestion['key']));
                }
                if (! empty($suggestion['label'])) {
                    $candidates[$index]['label'] = (string) $suggestion['label'];
                }

            }
        }

        return $this->nameRegions($candidates);
    }

    /**
     * Naming a region needs the whole page: whether a band is the hero or the
     * footer is only clear next to the others. Element naming is batched, so
     * each of those calls sees a fragment. Regions therefore get one separate
     * call carrying a single line per band, which fits however large the page.
     *
     * @param  array<int, array<string, mixed>>  $candidates
     * @return array<int, array<string, mixed>>
     */
    protected function nameRegions(array $candidates): array
    {
        // HTML already states what some bands are. Asking the model to guess
        // those invites it to call a <footer> "Features", so they are settled
        // here and only the ambiguous <section>s are sent.
        $certain = ['footer' => 'Footer', 'nav' => 'Navigation', 'header' => 'Header'];

        $bands = [];
        $regions = [];
        foreach ($candidates as $candidate) {
            $band = $candidate['band'] ?? null;
            if ($band === null) {
                continue;
            }
            $known = $certain[$candidate['bandTag'] ?? ''] ?? null;
            if ($known !== null) {
                $regions[$band] = $known;

                continue;
            }
            $sample = is_string($candidate['sample'] ?? null) ? trim($candidate['sample']) : '';
            if ($sample !== '' && count($bands[$band] ?? []) < 8) {
                $bands[$band][] = mb_substr($sample, 0, 60);
            }
        }

        if ($bands !== []) {
            try {
                $regions += $this->askRegions($bands);
            } catch (Throwable) {
                // keep whatever the DOM already settled
            }
        }

        if ($regions === []) {
            return $candidates;
        }

        foreach ($candidates as $index => $candidate) {
            $band = $candidate['band'] ?? null;
            if ($band !== null && filled($regions[$band] ?? null)) {
                $candidates[$index]['region'] = $regions[$band];
            }
        }

        return $candidates;
    }

    /**
     * @param  array<int, array<int, string>>  $bands
     * @return array<int, string>
     */
    protected function askRegions(array $bands): array
    {
        ksort($bands);
        $payload = [];
        foreach ($bands as $band => $samples) {
            $payload[] = ['band' => $band, 'text' => implode(' | ', $samples)];
        }

        $system = 'You are shown the content sections of one web page, in order, as a band number and a sample '
            .'of that band\'s text. Name what each band is for, from a reader\'s point of view, in one or two '
            .'words: for example "Hero", "Services", "About", "Features", "Pricing", "Testimonials", "FAQ", '
            .'"Contact", "Gallery", "Team". The first band is usually the page\'s opening pitch. Bands are '
            .'different parts of the page, so give them different names unless two genuinely serve the same '
            .'purpose. Never answer with a vague name such as "Content", "Section" or "Main", and never use '
            .'"Header", "Footer" or "Navigation": those parts of the page are already named. If a band\'s text is '
            .'placeholder filler with no real meaning, name it from its shape instead, such as "Highlights".  '
            .'Respond as JSON: {"bands":[{"band":0,"region":"..."}]}';

        $response = Http::withToken(config('live-edit.ai.api_key'))
            ->timeout((int) config('live-edit.ai.timeout', 30))
            ->post(config('live-edit.ai.endpoint'), [
                'model' => config('live-edit.ai.model'),
                'temperature' => 0,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => json_encode(['bands' => $payload], JSON_UNESCAPED_SLASHES)],
                ],
            ])
            ->throw();

        $parsed = json_decode(data_get($response->json(), 'choices.0.message.content', '{}'), true) ?: [];

        $out = [];
        foreach ($parsed['bands'] ?? [] as $entry) {
            if (isset($entry['band'], $entry['region'])) {
                $out[(int) $entry['band']] = (string) $entry['region'];
            }
        }

        return $out;
    }

    /** @var array<string, int> */
    protected array $seenKeys = [];

    protected function uniqueKey(string $key): string
    {
        if (! isset($this->seenKeys[$key])) {
            $this->seenKeys[$key] = 1;

            return $key;
        }

        return $key.(++$this->seenKeys[$key]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $candidates
     * @return array<int, array{key?: string, label?: string}>
     */
    protected function ask(array $candidates): array
    {
        $items = [];
        foreach ($candidates as $i => $c) {
            $items[] = [
                'i' => $i,
                'band' => $c['band'] ?? null,
                'kind' => $c['kind'],
                'tag' => $c['tag'],
                'text' => is_string($c['sample'] ?? null) ? mb_substr($c['sample'], 0, 80) : '',
            ];
        }

        $system = 'You help a website editor understand a page. The items are elements in document order. '
            .'For each one return: a concise camelCase "key" (semantic, from the element role and text, '
            .'e.g. heroHeadline, servicesSubtitle, footerAddress); a short human "label" a non-technical '
            .'person would recognise (e.g. "Hero headline", "FAQ question", "Price"); and "region", the part '
            .'Keep keys unique. Do not add or remove items. '
            .'Respond as JSON: {"items":[{"i":0,"key":"...","label":"..."}]}';

        $response = Http::withToken(config('live-edit.ai.api_key'))
            ->timeout((int) config('live-edit.ai.timeout', 30))
            ->post(config('live-edit.ai.endpoint'), [
                'model' => config('live-edit.ai.model'),
                'temperature' => 0,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => json_encode(['items' => $items], JSON_UNESCAPED_SLASHES)],
                ],
            ])
            ->throw();

        $content = data_get($response->json(), 'choices.0.message.content', '{}');
        $parsed = json_decode($content, true) ?: [];

        $out = [];
        foreach ($parsed['items'] ?? [] as $item) {
            if (isset($item['i'])) {
                $out[(int) $item['i']] = [
                    'key' => $item['key'] ?? null,
                    'label' => $item['label'] ?? null,
                ];
            }
        }

        return $out;
    }

    protected function sanitiseKey(string $key): string
    {
        $clean = preg_replace('/[^A-Za-z0-9]+/', ' ', $key);

        return lcfirst(str_replace(' ', '', ucwords(trim($clean)))) ?: 'field';
    }
}
