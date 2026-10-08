<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Dom\HTMLDocument;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\LiveEdit;
use ShipFast\LiveEdit\Support\RemoteContent;
use ShipFast\LiveEdit\Support\WhereTheWordsLive;
use Throwable;

/**
 * Where this page's words come from, and whether that is working.
 *
 * Written after a fault that took four releases and about thirty messages to
 * locate, almost all of it spent reconstructing from the outside what the
 * server could have said in one line. A cloud install had no
 * LIVE_EDIT_APP_KEY, so it could not read published content while rendering a
 * page, so it fell back to an ancient snapshot file nobody knew was still
 * there. The editor worked. The browser applied every change. The owner saw
 * their own site exactly as they had left it. Only visitors and crawlers got
 * the theme's copy, and nothing anywhere said so.
 *
 * Every question asked during that hunt is a line of output here. There are
 * four possible sources for a page's words and the whole difficulty was not
 * knowing which one had answered.
 *
 * Read only, and safe on production: it touches no content and writes nothing.
 */
class Diagnose extends Command
{
    protected $signature = 'live-edit:diagnose
                            {--locale= : Ask about a language other than the application\'s own.}';

    protected $description = 'Say where this site\'s published content is read from, and whether that read works';

    public function handle(): int
    {
        $this->line('engine            '.LiveEdit::VERSION);
        $this->line('laravel           '.app()->version());
        $this->line('php               '.PHP_VERSION.'   libxml '.LIBXML_DOTTED_VERSION);

        /*
         * Said because it decides whether server-side tagging builds the same
         * tree the browser did. Without it the keys this install derives can
         * differ from the ones the browser saved against.
         */
        $this->line('spec parser       '.(class_exists(HTMLDocument::class)
            ? 'yes'
            : 'NO (PHP 8.3 or older: keys are derived from libxml\'s tree, not the browser\'s)'));

        $this->newLine();

        $withService = WhereTheWordsLive::withTheService();
        $this->line('content lives     '.($withService ? 'with the service' : 'in this application'));
        $this->line('auto tagging      '.(config('live-edit.auto_tag') ? 'on' : 'OFF (nothing is tagged, so nothing is applied)'));

        $host = rtrim((string) (config('live-edit.licence.host') ?: config('live-edit.cloud.host')), '/');
        $site = (string) (config('live-edit.licence.site') ?: config('live-edit.cloud.site'));
        $key = (string) config('live-edit.licence.key');

        $this->line('licence host      '.($host ?: '(not set)'));
        $this->line('licence site      '.($site ?: '(not set)'));

        /*
         * Never the key itself. It is publishable rather than secret, but a
         * command people paste into chat and into tickets should not be the
         * thing that spreads it around.
         */
        $this->line('app key           '.($key !== '' ? 'set' : 'NOT SET'));

        $asked = config('live-edit.remote_content');
        $this->line('remote reads      '.match (true) {
            $asked === null => app()->runningUnitTests() ? 'off (default, while running tests)' : 'on (default)',
            (bool) $asked => 'on (set explicitly)',
            default => 'OFF (set explicitly)',
        });

        $named = config('live-edit.snapshot_url');
        $this->line('snapshot url      '.(filled($named) ? (string) $named : '(none named)'));

        $this->newLine();

        $locale = (string) ($this->option('locale') ?: app()->getLocale());
        $this->line("locale            {$locale}");

        if ($withService && $host !== '' && $site !== '' && $key !== '') {
            $this->askTheService($host, $site, $key, $locale);
        }

        /*
         * What the middleware will actually use, which is the question. Asked
         * last and through the real code path, so this line cannot disagree
         * with the page: everything above is a reason, this is the answer.
         */
        $settings = [];

        try {
            $settings = RemoteContent::settings($locale);
        } catch (Throwable $e) {
            $this->line('read failed       '.$e->getMessage());
        }

        $this->newLine();
        $this->line('overrides in use  '.count($settings));

        if ($settings === []) {
            /*
             * Short lines, and plain rather than $this->components.
             *
             * components renders through Termwind, which is invisible to grep
             * and to a test asserting the sentence exists. And one long
             * paragraph is both hard to read in a terminal and impossible to
             * assert twice against, since the test helper can only match one
             * substring per line written.
             */
            foreach ($this->whatIsWrong($withService, $key) as $line) {
                $this->warn($line);
            }

            return self::FAILURE;
        }

        $this->info(count($settings).' override(s) will be applied while rendering a page.');

        return self::SUCCESS;
    }

    /**
     * The diagnosis, a line at a time, in the order somebody needs it: what is
     * happening, who it is happening to, and what to do.
     *
     * @return list<string>
     */
    private function whatIsWrong(bool $withService, string $key): array
    {
        if ($withService && $key === '') {
            return [
                'No LIVE_EDIT_APP_KEY, so published content cannot be read while rendering a page.',
                'Visitors and crawlers are being served the words in your templates.',
                'The key is the publishable one already printed into every page this site serves.',
            ];
        }

        return ['No published content is being applied, so pages render the words in your templates.'];
    }

    /**
     * Ask the service directly, so a failing read is distinguishable from an
     * empty one.
     *
     * These are different problems with different owners, and from the page
     * they look identical: a 401 is a key, a timeout is a network, and an
     * empty set is a site nobody has published yet.
     */
    private function askTheService(string $host, string $site, string $key, string $locale): void
    {
        try {
            $response = Http::withToken($key)
                ->timeout((int) config('live-edit.remote_timeout', 5))
                ->acceptJson()
                ->get("{$host}/api/live-edit/v1/{$site}/content", ['locale' => $locale]);
        } catch (Throwable $e) {
            $this->line('service           unreachable: '.$e->getMessage());

            return;
        }

        $published = $response->json('settings');

        $this->line('service           HTTP '.$response->status().match (true) {
            $response->status() === 401 => ' (the key was refused)',
            $response->status() === 404 => ' (no such site at that host)',
            ! $response->successful() => ' (the service is unwell)',
            default => '',
        });

        if (is_array($published)) {
            $this->line('service publishes '.count($published).' override(s)');
        }
    }
}
