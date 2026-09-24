<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Gate;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\ElementStyle;

/**
 * Holds edits back until someone publishes them.
 *
 * Every change used to go live the instant it saved, which is a poor thing to
 * hand a client learning the editor on their own site: a half-finished sentence
 * is public while they are still typing it. With drafts on, a change shadows
 * the published value — the editor sees it, and so does anyone holding a
 * preview link, but visitors keep the published site until it is published.
 *
 * Off by default, so an existing installation keeps behaving as it did until it
 * turns publishing on.
 */
class DraftStore
{
    /** The session flag a preview link sets. */
    public const PREVIEW_SESSION_KEY = 'live-edit.preview';

    public static function enabled(): bool
    {
        return (bool) config('live-edit.publishing', false);
    }

    /**
     * Whether this viewer should see unpublished work: someone who may edit, or
     * someone who followed a preview link.
     */
    public static function visibleToViewer(): bool
    {
        if (! self::enabled()) {
            return false;
        }

        return Gate::allows('live-edit') || (bool) session(self::PREVIEW_SESSION_KEY, false);
    }

    /** Record a change as unpublished. */
    public static function put(string $kind, string $subject, array $payload): void
    {
        Draft::query()->updateOrCreate(
            ['kind' => $kind, 'subject' => $subject],
            ['payload' => $payload]
        );
    }

    /** @return array<string, string> subject => value, for settings */
    public static function settings(): array
    {
        return Draft::query()->where('kind', 'setting')->get()
            ->mapWithKeys(fn (Draft $d) => [$d->subject => (string) ($d->payload['value'] ?? '')])
            ->all();
    }

    /** @return array<string, array<string, string>> subject => props, for styles */
    public static function styles(): array
    {
        return Draft::query()->where('kind', 'style')->get()
            ->mapWithKeys(fn (Draft $d) => [$d->subject => (array) ($d->payload['props'] ?? [])])
            ->all();
    }

    public static function pending(): int
    {
        return Draft::query()->count();
    }

    /**
     * Put every held change live, and empty the drafts.
     *
     * Returns how many were published, which is what the editor reports back.
     */
    public static function publish(): int
    {
        $drafts = Draft::query()->get();
        $model = config('live-edit.setting_model');

        foreach ($drafts as $draft) {
            match ($draft->kind) {
                'setting' => $model::query()->updateOrCreate(
                    ['key' => $draft->subject],
                    ['value' => (string) ($draft->payload['value'] ?? '')]
                ),
                'style' => filled($draft->payload['props'] ?? [])
                    ? ElementStyle::query()->updateOrCreate(['key' => $draft->subject], ['props' => $draft->payload['props']])
                    : ElementStyle::query()->where('key', $draft->subject)->delete(),
                default => null,
            };
        }

        $count = $drafts->count();
        Draft::query()->delete();

        return $count;
    }

    /** Throw the held changes away, leaving the published site as it was. */
    public static function discard(): int
    {
        $count = Draft::query()->count();
        Draft::query()->delete();

        return $count;
    }
}
