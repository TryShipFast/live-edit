<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Domain\Site\TokenType;

/**
 * Creating sites and keys, which otherwise could only be done by hand in the
 * database — where it would be easy to store a secret in the clear.
 */
class ManageApiSite extends Command
{
    protected $signature = 'live-edit:site
        {action : create|key|list|revoke}
        {name? : the site slug, or the key id when revoking}
        {--origins= : comma separated origins allowed to call from a browser}
        {--type=publishable : publishable|secret}
        {--label=API key}';

    protected $description = 'Manage API sites and keys';

    public function handle(): int
    {
        return match ($this->argument('action')) {
            'create' => $this->createSite(),
            'key' => $this->issueKey(),
            'list' => $this->listAll(),
            'revoke' => $this->revoke(),
            default => $this->abortWith('Unknown action. Use create, key, list or revoke.'),
        };
    }

    private function createSite(): int
    {
        $slug = (string) $this->argument('name');

        if ($slug === '') {
            return $this->abortWith('A site slug is required.');
        }

        if (Site::query()->where('slug', $slug)->exists()) {
            return $this->abortWith("A site called {$slug} already exists.");
        }

        $origins = $this->origins();

        $site = Site::query()->create([
            'slug' => $slug,
            'name' => $slug,
            'allowed_origins' => $origins,
        ]);

        $this->info("Created site {$site->slug}.");

        if ($origins === []) {
            // Not a failure, but worth saying plainly: until an origin is
            // listed, no browser can call, and the first symptom is a CORS
            // error that looks like a bug in their page.
            $this->warn('No origins listed yet, so no browser can call this site. Add them with --origins.');
        }

        return self::SUCCESS;
    }

    private function issueKey(): int
    {
        $site = Site::query()->where('slug', (string) $this->argument('name'))->first();

        if ($site === null) {
            return $this->abortWith('No such site.');
        }

        $type = TokenType::tryFrom((string) $this->option('type'));

        if ($type === null || $type === TokenType::Session) {
            return $this->abortWith('Type must be publishable or secret. Sessions are minted over the API.');
        }

        [$token, $plain] = $site->issueToken($type, (string) $this->option('label'));

        $this->newLine();
        $this->info("{$type->value} key for {$site->slug}:");
        $this->line($plain);
        $this->newLine();

        // Shown once because only a hash is kept. Saying so here is kinder
        // than letting someone discover it when they come back for it.
        $this->warn('Copy this now — it is stored only as a hash and cannot be shown again.');

        if ($type === TokenType::Secret) {
            $this->warn('Keep this on a server. A secret key is refused if it is ever presented from a browser.');
        }

        return self::SUCCESS;
    }

    private function listAll(): int
    {
        $sites = Site::query()->with('tokens')->get();

        if ($sites->isEmpty()) {
            $this->info('No sites yet.');

            return self::SUCCESS;
        }

        foreach ($sites as $site) {
            $this->newLine();
            $this->info($site->slug.($site->isActive() ? '' : ' (suspended)'));
            $this->line('  origins: '.(implode(', ', $site->allowed_origins ?? []) ?: 'none'));

            foreach ($site->tokens as $token) {
                $this->line(sprintf(
                    '  %s  %-12s %-20s %s',
                    $token->public_id,
                    $token->type,
                    $token->name,
                    $this->stateOf($token),
                ));
            }
        }

        return self::SUCCESS;
    }

    private function revoke(): int
    {
        $token = ApiToken::query()->where('public_id', (string) $this->argument('name'))->first();

        if ($token === null) {
            return $this->abortWith('No such key.');
        }

        $token->revoke();
        $this->info("Revoked {$token->public_id}. It stops working immediately.");

        return self::SUCCESS;
    }

    private function stateOf(ApiToken $token): string
    {
        return match (true) {
            $token->revoked_at !== null => 'revoked',
            ! $token->isUsable() => 'expired',
            $token->last_used_at !== null => 'last used '.$token->last_used_at->diffForHumans(),
            default => 'never used',
        };
    }

    /** @return array<int, string> */
    private function origins(): array
    {
        $raw = (string) $this->option('origins');

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
    }

    private function abortWith(string $message): int
    {
        $this->error($message);

        return self::FAILURE;
    }
}
