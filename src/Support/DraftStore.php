<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
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
        if (! config('live-edit.publishing', false)) {
            return false;
        }

        // Turned on before the migration has run, holding an edit back would
        // mean writing to a table that is not there. Behaving as though
        // publishing were off is the safe reading.
        return Schema::hasTable((new Draft)->getTable());
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

        // What just went live is written as a version, so there is a record of
        // the state rather than only of the changes that produced it.
        Snapshot::publish($count);

        return $count;
    }

    /**
     * Put an earlier version back.
     *
     * Applied forward rather than by rewinding: the restore becomes the newest
     * version, so history stays append-only and going back from a bad rollback
     * is the same operation again.
     */
    public static function restore(int $number): ?int
    {
        $snapshot = Snapshot::read($number);
        if ($snapshot === null) {
            return null;
        }

        $model = config('live-edit.setting_model');
        $changed = 0;

        foreach (($snapshot['settings'] ?? []) as $key => $value) {
            $existing = $model::query()->where('key', $key)->value('value');
            if ((string) $existing === (string) $value) {
                continue;
            }
            $model::query()->updateOrCreate(['key' => $key], ['value' => $value]);
            $changed++;
        }

        foreach (($snapshot['styles'] ?? []) as $key => $props) {
            ElementStyle::query()->updateOrCreate(['key' => $key], ['props' => $props]);
        }

        // Pending work is not what was asked for: restoring is a decision about
        // what is live, and leaving drafts on top would immediately undo it.
        Draft::query()->delete();
        Snapshot::publish($changed, $number);

        return $changed;
    }

    /** Throw the held changes away, leaving the published site as it was. */
    public static function discard(): int
    {
        $count = Draft::query()->count();
        Draft::query()->delete();

        return $count;
    }
}
