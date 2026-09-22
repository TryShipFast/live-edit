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
    public function enabled(): bool
    {
        return (bool) config('live-edit.ai.enabled') && filled(config('live-edit.ai.api_key'));
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

        return $candidates;
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
                'kind' => $c['kind'],
                'tag' => $c['tag'],
                'text' => is_string($c['sample'] ?? null) ? mb_substr($c['sample'], 0, 80) : '',
            ];
        }

        $system = 'You name editable elements for a website CMS. For each item, return a concise camelCase '
            .'"key" (semantic, from the element role and text — e.g. heroHeadline, servicesSubtitle, footerAddress) '
            .'and a short human "label" (e.g. "Hero headline"). Keep keys unique. Do not add or remove items. '
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
                $out[(int) $item['i']] = ['key' => $item['key'] ?? null, 'label' => $item['label'] ?? null];
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
