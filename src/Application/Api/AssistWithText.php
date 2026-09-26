<?php

namespace ShipFast\LiveEdit\Application\Api;

use Illuminate\Support\Facades\Http;
use ShipFast\LiveEdit\Domain\Credits\Credits;
use ShipFast\LiveEdit\Domain\Site\Site;

/**
 * Rewriting a sentence somebody already has.
 *
 * Deliberately not "write my website for me". The product's whole argument is
 * that a human designed the page and the client owns the words; this helps
 * with one of them, on request, and hands back something they can then edit
 * like anything else.
 *
 * Context matters more than the model does. "Rewrite this" on the string
 * "Book now" produces marketing sludge; the same request told that it is a
 * button, under a heading about same-day appointments, on a clinic's site,
 * produces something that fits. So the surrounding page goes with the ask.
 *
 * The key is read from the environment and never leaves the server.
 */
class AssistWithText
{
    public function __construct(private readonly Credits $credits) {}

    public function available(): bool
    {
        return (bool) config('live-edit.ai.enabled') && filled(config('live-edit.ai.api_key'));
    }

    /**
     * @param  array{heading?: string, page?: string, role?: string, tone?: string}  $context
     * @return array{text: string|null, balance: int, reason?: string}
     */
    public function __invoke(Site $site, string $action, string $text, array $context = []): array
    {
        if (! in_array($action, ['rewrite', 'shorten'], true)) {
            return ['text' => null, 'balance' => $this->credits->balance($site), 'reason' => 'unknown_action'];
        }

        if (trim($text) === '') {
            return ['text' => null, 'balance' => $this->credits->balance($site), 'reason' => 'nothing_to_work_with'];
        }

        if (! $this->available()) {
            return ['text' => null, 'balance' => $this->credits->balance($site), 'reason' => 'not_configured'];
        }

        // Paid for first. A model call that is charged afterwards is a model
        // call somebody can take for free by closing the tab.
        $balance = $this->credits->spend($site, $action, [
            'page' => $context['page'] ?? null,
            'was' => mb_substr($text, 0, 120),
        ]);

        if ($balance === null) {
            return ['text' => null, 'balance' => $this->credits->balance($site), 'reason' => 'not_enough_credits'];
        }

        $written = $this->ask($action, $text, $context);

        if ($written === null || trim($written) === '' || trim($written) === trim($text)) {
            // Nothing usable came back, so nothing was delivered, so it is not
            // paid for. Keeping the credit would be charging for silence.
            return [
                'text' => null,
                'balance' => $this->credits->refund($site, $action, ['page' => $context['page'] ?? null]),
                'reason' => 'no_suggestion',
            ];
        }

        return ['text' => $written, 'balance' => $balance];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    protected function ask(string $action, string $text, array $context): ?string
    {
        $instruction = $action === 'shorten'
            ? 'Rewrite it shorter while keeping every fact in it. Fewer words, same meaning.'
            : 'Rewrite it more clearly and naturally, keeping every fact in it and keeping roughly the same length.';

        $about = collect([
            isset($context['role']) ? "It is the {$context['role']} of the section." : null,
            isset($context['heading']) ? "The heading above it reads: \"{$context['heading']}\"." : null,
            isset($context['page']) ? "The page is: {$context['page']}." : null,
        ])->filter()->join(' ');

        try {
            $response = Http::withToken(config('live-edit.ai.api_key'))
                ->timeout((int) config('live-edit.ai.timeout', 30))
                ->post(config('live-edit.ai.endpoint'), [
                    'model' => config('live-edit.ai.model'),
                    'temperature' => 0.4,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => implode(' ', [
                                'You rewrite one piece of copy on a small business website.',
                                'Return only the rewritten text: no quotes, no preamble, no options, no markdown.',
                                'Keep the language it was written in.',
                                'Never invent facts, prices, dates, names or claims that are not already there.',
                                'Match the register of the original; if it is plain, stay plain.',
                            ]),
                        ],
                        [
                            'role' => 'user',
                            'content' => trim("{$instruction} {$about}\n\nThe text:\n{$text}"),
                        ],
                    ],
                ]);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $written = $response->json('choices.0.message.content');

        if (! is_string($written)) {
            return null;
        }

        // Models like to wrap an answer in quotes even when told not to, and a
        // heading that arrives wearing them looks like a mistake on the page.
        return trim(trim(trim($written), '"'."'"));
    }
}
