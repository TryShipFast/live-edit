<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use ShipFast\LiveEdit\Mapper\AiRefiner;
use ShipFast\LiveEdit\Mapper\MarkupScanner;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Support\KeyMigrator;

/**
 * Points the auto-mapper at a rendered HTML file (or a URL's saved output)
 * and prints the editable surface it recognises: the review step before any
 * tags are written. Emits a suggested config skeleton with --config.
 */
class ScanForEditables extends Command
{
    protected $signature = 'live-edit:scan {path? : Path to an HTML file to scan}
                            {--url= : Render this URL headlessly and scan the computed result (finds class/stylesheet backgrounds)}
                            {--json : Output the raw candidate list as JSON}
                            {--config : Print a suggested config/live-edit.php skeleton}
                            {--ai : Refine the suggested keys and labels with the configured LLM}
                            {--apply : Write data-edit tags into the file (text/image/link)}
                            {--in-place : With --apply, overwrite the file instead of writing <name>.tagged.html}
                            {--auto : With --apply, write stable auto-keys (setting:auto:<hash>) instead of semantic keys — for the generic store, no per-element config}
                            {--migrate : Carry saved content over to the new keys when re-tagging}
                            {--force : Allow --apply on a Blade/PHP template (unsafe — it will corrupt the source)}';

    protected $description = 'Scan an HTML file for editable elements — report a tagging plan or apply it';

    public function handle(MarkupScanner $scanner, AiRefiner $refiner): int
    {
        $url = $this->option('url');
        $path = $this->argument('path');

        if ($url === null && $path === null) {
            $this->error('Provide a file path or --url=<url> to scan.');

            return self::FAILURE;
        }

        // Rendered mode: headless Chromium resolves the real DOM plus every
        // computed background (class/stylesheet ones a text scan can't see).
        if ($url !== null) {
            return $this->scanUrl($scanner, $refiner, $url);
        }

        if (! is_file($path)) {
            $this->error("File not found: {$path}");

            return self::FAILURE;
        }

        $html = (string) file_get_contents($path);

        if ($this->option('apply')) {
            return $this->apply($scanner, $refiner, $path, $html);
        }

        $result = $scanner->scan($html);

        if ($this->looksLikeTemplate($path, $html)) {
            $this->components->warn(
                'This looks like a Blade/PHP template. Scan works, but keys will include '
                .'template tokens and repeated rows inside @foreach show as one item. '
                .'Scan the RENDERED page instead for clean keys and real collections.'
            );
        }

        return $this->report($result, basename($path), $refiner);
    }

    /**
     * Rendered scan: hand the URL to headless Chromium, feed the real DOM to
     * the scanner (clean keys, true @foreach collections) and merge in every
     * computed background image — the class/stylesheet ones a text scan misses.
     */
    protected function scanUrl(MarkupScanner $scanner, AiRefiner $refiner, string $url): int
    {
        if ($this->option('apply')) {
            $this->error('--apply writes to a file and cannot be combined with --url.');

            return self::FAILURE;
        }

        try {
            $rendered = $this->render($url);
        } catch (\Throwable $e) {
            $this->components->error('Rendered scan failed: '.$e->getMessage());
            $this->components->info('Needs Node + Playwright (npx playwright install chromium). Set live-edit.scan.node to the node binary if it is not on PATH.');

            return self::FAILURE;
        }

        $result = $scanner->scan($rendered['html']);
        $result = $this->mergeComputedBackgrounds($result, $rendered['backgrounds']);

        return $this->report($result, $url, $refiner);
    }

    /**
     * Run the headless renderer and return its {html, backgrounds}.
     *
     * @return array{html: string, backgrounds: array<int, array<string, mixed>>}
     */
    protected function render(string $url): array
    {
        $node = (string) config('live-edit.scan.node', 'node');
        $script = dirname(__DIR__, 3).'/bin/rendered-scan.mjs';

        $result = Process::timeout(60)->run([$node, $script, $url]);

        if (! $result->successful()) {
            throw new \RuntimeException(trim($result->errorOutput()) ?: 'renderer exited non-zero');
        }

        $data = json_decode($result->output(), true);
        if (! is_array($data) || ! isset($data['html'])) {
            throw new \RuntimeException('renderer returned no usable output');
        }

        return ['html' => (string) $data['html'], 'backgrounds' => $data['backgrounds'] ?? []];
    }

    /**
     * Fold computed backgrounds into the scanner result, skipping any URL the
     * text scan already found inline so nothing is listed twice.
     *
     * @param  array{candidates: array<int, array<string, mixed>>, summary: array<string, int>}  $result
     * @param  array<int, array<string, mixed>>  $backgrounds
     * @return array{candidates: array<int, array<string, mixed>>, summary: array<string, int>}
     */
    protected function mergeComputedBackgrounds(array $result, array $backgrounds): array
    {
        $seen = [];
        foreach ($result['candidates'] as $candidate) {
            if (($candidate['kind'] ?? null) === 'background') {
                $seen[$candidate['sample'] ?? ''] = true;
            }
        }

        foreach ($backgrounds as $i => $bg) {
            $url = (string) ($bg['url'] ?? '');
            if ($url === '' || isset($seen[$url])) {
                continue;
            }
            $seen[$url] = true;

            $tag = (string) ($bg['tag'] ?? 'div');
            $result['candidates'][] = [
                'kind' => 'background',
                'tag' => $tag,
                'key' => 'bg'.ucfirst($tag).($i > 0 ? $i + 1 : ''),
                'sample' => $url,
                'suggested' => 'data-edit-bg="setting:<key>" on '.($bg['selector'] ?? $tag),
            ];
            $result['summary']['background'] = ($result['summary']['background'] ?? 0) + 1;
        }

        return $result;
    }

    /**
     * @param  array{candidates: array<int, array<string, mixed>>, summary: array<string, int>}  $result
     */
    protected function report(array $result, string $label, AiRefiner $refiner): int
    {
        if ($this->option('ai')) {
            if (! $refiner->enabled()) {
                $this->components->warn('AI refinement is off — set LIVE_EDIT_AI=true and OPENAI_API_KEY. Showing deterministic result.');
            } else {
                $result['candidates'] = $refiner->refine($result['candidates']);
            }
        }

        if ($this->option('json')) {
            $this->line(json_encode($result['candidates'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return self::SUCCESS;
        }

        if ($this->option('config')) {
            $this->printConfig($result['candidates']);

            return self::SUCCESS;
        }

        $this->components->info('Editable surface recognised in '.$label);

        $kinds = array_keys($result['summary']);
        sort($kinds);
        foreach ($kinds as $kind) {
            $rows = collect($result['candidates'])->where('kind', $kind)->map(fn ($c) => [
                $c['key'],
                "<{$c['tag']}>",
                $c['sample'],
            ])->all();

            if ($rows === []) {
                continue;
            }

            $this->newLine();
            $this->line('  <fg=cyan>'.ucfirst($kind).' ('.count($rows).')</>');
            $this->table(['suggested key', 'element', 'sample'], $rows);
        }

        $this->newLine();
        $total = array_sum($result['summary']);
        $this->components->info("{$total} editable elements found. Review, then run with --config for a starter config.");

        return self::SUCCESS;
    }

    protected function apply(MarkupScanner $scanner, AiRefiner $refiner, string $path, string $html): int
    {
        // Writing tags back through the HTML parser corrupts Blade: `->` becomes
        // `-&gt;` and `{{ route() }}` in an attribute gets URL-encoded. Refuse
        // unless the caller insists with --force. Scan the rendered page instead.
        if ($this->looksLikeTemplate($path, $html) && ! $this->option('force')) {
            $this->components->error('Refusing to --apply tags to a Blade/PHP template — it would corrupt the source.');
            $this->components->info(
                'Render the page to HTML and scan that (e.g. save the rendered output, or scan its URL). '
                .'Then copy the tags into your template by hand, binding records to your models. '
                .'Pass --force only if you understand the file will be mangled.'
            );

            return self::FAILURE;
        }

        // With --ai, the model names each element ("Hero headline") instead of
        // leaving the editor a generic role ("Heading"). Detection stays
        // deterministic; only the naming is interpreted.
        $labeller = null;
        if ($this->option('ai')) {
            if (! $refiner->enabled()) {
                $this->components->warn('AI naming is off. Set LIVE_EDIT_AI=true and OPENAI_API_KEY to label elements.');
            } else {
                $labeller = function (array $candidates) use ($refiner): array {
                    $refined = $refiner->refine($candidates);

                    return array_map(fn (array $candidate) => [
                        'label' => $candidate['label'] ?? null,
                        'region' => $candidate['region'] ?? null,
                    ], $refined);
                };
            }
        }

        // Read what the previous tagging produced before it is overwritten:
        // it is the only record of which key used to belong to which element.
        $previous = ($this->option('migrate') && is_file($this->targetFor($path)))
            ? (string) file_get_contents($this->targetFor($path))
            : null;

        $result = $scanner->apply($html, ['text', 'image', 'link'], (bool) $this->option('auto'), $labeller);

        $target = $this->targetFor($path);

        file_put_contents($target, $result['html']);

        if ($previous !== null) {
            $this->migrate($previous, $result['html']);
        }

        $this->components->info("Tagged {$result['applied']} elements → ".basename($target));

        if ($result['skipped'] !== []) {
            $lines = [];
            foreach ($result['skipped'] as $kind => $count) {
                $lines[] = "{$count} {$kind}";
            }
            $this->components->warn('Left for you to wire by hand (need a backing model): '.implode(', ', $lines).'.');
        }

        return self::SUCCESS;
    }

    protected function targetFor(string $path): string
    {
        return $this->option('in-place')
            ? $path
            : (preg_replace('/(\.[^.]+)$/', '.tagged$1', $path) ?: $path.'.tagged');
    }

    /**
     * Move stored content from the keys the previous tagging used to the ones
     * this tagging produced, so a client's work survives a re-tag.
     */
    protected function migrate(string $previousHtml, string $currentHtml): void
    {
        $map = KeyMigrator::between($previousHtml, $currentHtml);

        if ($map === []) {
            $this->components->info('Keys are unchanged; nothing to migrate.');

            return;
        }

        $settings = config('live-edit.setting_model');
        $moved = 0;

        // Two passes with a temporary prefix: a key being moved onto may itself
        // still be in use by another row until that row has moved.
        foreach ([true, false] as $parking) {
            foreach ($map as $old => $new) {
                [$from, $to] = $parking ? [$old, '~migrating~'.$new] : ['~migrating~'.$new, $new];

                $moved += $settings::query()->where('key', $from)->update(['key' => $to]);

                // Image settings carry siblings (Alt, Credit, Href) and each
                // locale keeps its own copy, so those travel too.
                foreach (['Alt', 'Credit', 'Href', 'Title'] as $suffix) {
                    $settings::query()->where('key', $from.$suffix)->update(['key' => $to.$suffix]);
                }
                $settings::query()->where('key', 'like', '%:'.$from)->get()->each(function ($row) use ($from, $to) {
                    $row->update(['key' => str_replace(':'.$from, ':'.$to, $row->key)]);
                });

                ElementStyle::query()->where('key', $from)->update(['key' => $to]);
            }
        }

        $this->components->info("Carried {$moved} saved value(s) onto the new keys.");
    }

    /**
     * A source file that carries Blade/PHP, not plain HTML — detected by
     * extension or by the presence of Blade directives / echo tags / PHP.
     */
    protected function looksLikeTemplate(string $path, string $html): bool
    {
        if (preg_match('/\.(blade\.php|php)$/i', $path)) {
            return true;
        }

        return (bool) preg_match('/\{\{.*?\}\}|@(if|foreach|for|while|section|php|include|extends|component|auth|can)\b|<x-[\w.-]+|<\?php/s', $html);
    }

    /**
     * @param  array<int, array<string, mixed>>  $candidates
     */
    protected function printConfig(array $candidates): void
    {
        $settings = collect($candidates)->where('kind', 'text')->pluck('key');
        $images = collect($candidates)->where('kind', 'image')->pluck('key');
        $links = collect($candidates)->where('kind', 'link')->pluck('key');
        $models = collect($candidates)->where('kind', 'collection')->unique('key');

        $fmt = fn ($items) => $items->map(fn ($k) => "'{$k}'")->implode(', ');

        $this->line("<?php\n\nreturn [\n");
        $this->line('    // Text + link settings the scanner recognised:');
        $this->line("    'settings' => [".$fmt($settings->merge($links->map(fn ($k) => $k)))."],\n");
        $this->line("    'images' => [".$fmt($images)."],\n");
        $this->line('    // Collections — set the model class for each (fields derived from the item):');
        $this->line("    'models' => [");
        foreach ($models as $model) {
            $fields = $fmt(collect($model['fields'] ?: ['title']));
            $this->line("        '{$model['key']}' => ['class' => \\App\\Models\\".ucfirst($model['key'])."::class, 'fields' => [{$fields}], 'creatable' => true, 'deletable' => true],");
        }
        $this->line("    ],\n];");
    }
}
