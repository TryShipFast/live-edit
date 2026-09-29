<?php

namespace ShipFast\LiveEdit\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Site\ApiToken;
use ShipFast\LiveEdit\Domain\Site\Provisioner;
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
        {--domain= : the website this licence is for, e.g. acme.com}
        {--platform= : laravel|wordpress|static|react|nextjs}
        {--type=publishable : publishable|secret}
        {--label=API key}';

    protected $description = 'Manage API sites and keys';

    public function handle(Provisioner $provisioner): int
    {
        return match ($this->argument('action')) {
            'create' => $this->createSite($provisioner),
            'key' => $this->issueKey(),
            'list' => $this->listAll(),
            'revoke' => $this->revoke(),
            default => $this->abortWith('Unknown action. Use create, key, list or revoke.'),
        };
    }

    /**
     * Register a site, by the same route the console's own form takes.
     *
     * This used to write the row itself, and produced a site that could not be
     * used: no domain, so the licence had no website to be for and nothing to
     * check an origin against; no verification code, so it could never be
     * verified; no platform; and no keys at all, leaving the operator to run a
     * second command before anything worked.
     *
     * Harmless while this was only ever a developer's convenience. It stopped
     * being harmless the moment registering sites became urgent, because the
     * command is what somebody reaches for under time pressure, and a
     * half-made site fails later and somewhere else - as a licence refusal on
     * the customer's page, not as an error here.
     *
     * So both ways in go through the Provisioner now, and there is one
     * definition of what a registered site is.
     */
    private function createSite(Provisioner $provisioner): int
    {
        $slug = (string) $this->argument('name');

        if ($slug === '') {
            return $this->abortWith('A site slug is required.');
        }

        try {
            $result = $provisioner->create(
                $slug,
                $slug,
                $this->origins(),
                ($this->option('domain') ?: null) === null ? null : (string) $this->option('domain'),
                ($this->option('platform') ?: null) === null ? null : (string) $this->option('platform'),
            );
        } catch (ValidationException $e) {
            return $this->abortWith(implode(' ', $e->validator->errors()->all()));
        }

        $site = $result['site'];

        $this->info("Registered {$site->slug}.");

        if ($site->domain === null) {
            // The licence is for a website. Without one named, the origin
            // check has nothing to compare against and verification cannot
            // start, and neither says so at the point of failure.
            $this->warn('No domain named, so this licence is not yet for any website. Add one with --domain.');
        }

        if ($site->allowed_origins === []) {
            // Not a failure, but worth saying plainly: until an origin is
            // listed, no browser can call, and the first symptom is a CORS
            // error that looks like a bug in their page.
            $this->warn('No origins listed yet, so no browser can call this site. Add them with --origins.');
        }

        $this->newLine();
        $this->info("Publishable key (the page reads with this):");
        $this->line($result['keys']['publishable']);
        $this->newLine();
        $this->info("Secret key (keep this on a server):");
        $this->line($result['keys']['secret']);
        $this->newLine();

        // Shown once because only a hash is kept. Saying so here is kinder
        // than letting somebody discover it when they come back for it.
        $this->warn('Copy both now - they are stored only as hashes and cannot be shown again.');
        $this->warn('These expire in a year. A key without an expiry is not a licence.');

        /*
         * What this did not do, said out loud.
         *
         * This command registers a licence: which site is asking, what keys
         * it holds, which addresses may use them. That is the whole of the
         * question the engine answers, and on a self-hosted install it is the
         * whole of the job.
         *
         * A site managed by the console has a second half that lives there
         * and cannot live here - an owner, a plan, a timezone, and a record
         * of who may sign in. A site registered by this command on a console
         * deployment is correctly licensed and invisible in the sites list,
         * on no plan, and impossible for its owner to sign in to: they are
         * sent to a sign-in with no account, on their own site.
         *
         * Worth printing every time rather than documenting somewhere. The
         * command now looks complete enough to be trusted for a job it only
         * half does, and it is reached for under exactly the time pressure
         * that stops people checking.
         */
        $this->newLine();
        $this->line('Registered the licence only: the site, its keys and its origins.');
        $this->line('An owner, a plan and who may sign in belong to the console and are not set here.');
        $this->line('If this site is managed by a console, register it there instead.');

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
