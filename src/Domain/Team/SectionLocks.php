<?php

namespace ShipFast\LiveEdit\Domain\Team;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use ShipFast\LiveEdit\Domain\Site\Site;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\SectionLock;

/**
 * One person per section, for one site.
 *
 * Owner, 5 Nov 2026: "we should lock a section a team member is working on
 * and publish releases it, otherwise, they override eachother works".
 *
 * How it stays light with many editors open:
 *
 *   - Claiming is one atomic statement: an insert that is ignored when the
 *     (site, unit) row exists, then, only if needed, one conditional update
 *     that succeeds only for the holder or when the lock has lapsed. The
 *     unique index decides a race; nothing reads and then writes.
 *   - Activity renews at most once a minute per person (one UPDATE over all of
 *     their locks, guarded by a cache key), not on every save or poll.
 *   - Who holds what is one cached answer per site, keyed by a revision that
 *     moves only when a lock or a draft's owner changes. A poll with nothing
 *     new is answered from cache with no query at all (ContentController::team
 *     turns it into a 304).
 *   - Expiry is lazy: a lock idle for longer than the limit is simply not
 *     counted when it is read or claimed. live-edit:prune-locks clears the
 *     rows on a schedule; nothing sweeps on a request.
 *
 * The website itself (Person::theWebsite, the site's own keys and every
 * session minted before this existed) never takes a lock and is never
 * refused: that is the single-editor site, which keeps working exactly as it
 * did.
 */
class SectionLocks
{
    public function __construct(public readonly Site $site) {}

    public static function idleMinutes(): int
    {
        return max(1, (int) config('live-edit.team.idle_minutes', 30));
    }

    /**
     * Take (or keep) a part of the site for this person.
     *
     * Throws LockRefused when somebody else holds it. With $continue, drafts
     * somebody left in this part when their lock lapsed become this person's:
     * that is "continue from them", and it is what a first save implies, since
     * the page they are editing already shows those words.
     *
     * @return array{lock: array<string, mixed>, left: array<int, array{author: string, name: string, changes: int}>}
     */
    public function claim(Person $person, string $unit, ?string $label = null, bool $continue = false, bool $describe = true): array
    {
        if (! $person->isSomeone()) {
            return ['lock' => [], 'left' => []];
        }

        $now = now();
        $label = $this->label($unit, $label);
        $changed = false;

        $inserted = SectionLock::query()->insertOrIgnore([
            'site_id' => $this->site->id,
            'unit' => $unit,
            'label' => $label,
            'holder' => $person->id,
            'holder_name' => $person->name,
            'holder_role' => $person->role,
            'claimed_at' => $now,
            'last_active_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if ($inserted === 1) {
            $changed = true;
            Cache::put($this->touchKey($person), true, 60);
        } elseif (! $this->keep($person, $unit)) {
            // Not theirs. Theirs to take only if the holder has gone quiet.
            $took = $this->locks()
                ->where('unit', $unit)
                ->where('holder', '!=', $person->id)
                ->where('last_active_at', '<', $this->cutoff())
                ->update([
                    'label' => $label,
                    'holder' => $person->id,
                    'holder_name' => $person->name,
                    'holder_role' => $person->role,
                    'claimed_at' => $now,
                    'last_active_at' => $now,
                    'taken_from' => null,
                    'taken_from_name' => null,
                    'updated_at' => $now,
                ]);

            if ($took !== 1) {
                throw $this->refusal($person, $this->locks()->where('unit', $unit)->first());
            }

            $changed = true;
        }

        $left = $this->leftBehind($person, $unit);

        if ($continue && $left !== []) {
            $this->drafts()->where('unit', $unit)
                ->where(fn ($q) => $q->whereNull('author')->orWhere('author', '!=', $person->id))
                ->update(['author' => $person->id, 'author_name' => $person->name]);
            $left = [];
            $changed = true;
        }

        if ($changed) {
            $this->moved();
        }

        if (! $describe) {
            return ['lock' => [], 'left' => $left];
        }

        $lock = $this->locks()->where('unit', $unit)->first();

        return ['lock' => $lock ? $this->describe($lock) : [], 'left' => $left];
    }

    /**
     * Refuse a write to $unit, or to a key already filed under another unit,
     * when somebody else holds it; otherwise claim $unit for this person.
     *
     * The second check is what makes the server the authority even when the
     * browser is stale: a draft remembers its unit, so a save that declares a
     * different (or no) unit for a key still meets the lock on the old one.
     */
    public function claimForWrite(Person $person, ?string $unit, ?string $label, ?string $existingUnit): void
    {
        if (! $person->isSomeone()) {
            return;
        }

        if ($existingUnit !== null && $existingUnit !== $unit) {
            $holder = $this->locks()->where('unit', $existingUnit)->where('last_active_at', '>=', $this->cutoff())->first();

            if ($holder !== null && $holder->holder !== $person->id) {
                throw $this->refusal($person, $holder);
            }
        }

        if ($unit !== null) {
            $this->claim($person, $unit, $label, true, false);
        }
    }

    /** Renew this person's locks, at most once a minute. One UPDATE over all of them. */
    public function touch(Person $person): void
    {
        if (! $person->isSomeone() || ! Cache::add($this->touchKey($person), true, 60)) {
            return;
        }

        $this->locks()->where('holder', $person->id)->update(['last_active_at' => now()]);
    }

    /** Let go of this person's locks (all of them, or the units named). Returns how many. */
    public function release(Person $person, ?array $units = null): int
    {
        if (! $person->isSomeone()) {
            return 0;
        }

        $released = $this->locks()
            ->where('holder', $person->id)
            ->when($units !== null, fn ($q) => $q->whereIn('unit', $units))
            ->delete();

        if ($released > 0) {
            $this->moved();
        }

        return $released;
    }

    /**
     * The owner takes a part of the site from whoever holds it, with their
     * unpublished changes there. The person who had it is told on their next
     * action ("The owner took over Hero").
     */
    public function takeOver(Person $owner, string $unit, ?string $label = null): array
    {
        if (! $owner->mayManage()) {
            throw new LockRefused('Only an admin can take over a section. Ask an admin to take over.', [], 'not_owner');
        }

        $lock = $this->locks()->where('unit', $unit)->first();

        if ($lock === null || $lock->holder === $owner->id) {
            return $this->claim($owner, $unit, $label, true)['lock'];
        }

        $now = now();

        $this->locks()->where('unit', $unit)->where('holder', $lock->holder)->update([
            'holder' => $owner->id,
            'holder_name' => $owner->name,
            'holder_role' => $owner->role,
            'claimed_at' => $now,
            'last_active_at' => $now,
            'taken_from' => $lock->holder,
            'taken_from_name' => $lock->holder_name,
            'updated_at' => $now,
        ]);

        $this->drafts()->where('unit', $unit)->update(['author' => $owner->id, 'author_name' => $owner->name]);
        $this->moved();

        return $this->describe($this->locks()->where('unit', $unit)->first());
    }

    /** The owner throws away what somebody else left in a part of the site. Returns how many changes. */
    public function discardLeft(Person $owner, string $unit): int
    {
        if (! $owner->mayManage()) {
            throw new LockRefused('Only an admin can throw away somebody else\'s changes.', [], 'not_owner');
        }

        $live = $this->locks()->where('unit', $unit)->where('last_active_at', '>=', $this->cutoff())->first();

        if ($live !== null && $live->holder !== $owner->id) {
            throw $this->refusal($owner, $live);
        }

        $gone = $this->drafts()->where('unit', $unit)
            ->where(fn ($q) => $q->whereNull('author')->orWhere('author', '!=', $owner->id))
            ->delete();

        if ($gone > 0) {
            $this->moved();
        }

        return $gone;
    }

    /**
     * Who holds what, for everybody on this site, from cache.
     *
     * Recomputed (two queries) only when the revision moved or a lock is due
     * to lapse; otherwise no query at all.
     *
     * @return array{revision: string, locks: array<int, array<string, mixed>>, left: array<int, array<string, mixed>>, valid_until: ?int}
     */
    public function state(): array
    {
        $revision = $this->revision();
        $key = 'live-edit.team.state.'.$this->site->id.'.'.$revision;
        $cached = Cache::get($key);

        if (is_array($cached) && ($cached['valid_until'] === null || $cached['valid_until'] > now()->getTimestamp())) {
            return $cached;
        }

        if (is_array($cached)) {
            // A lock is due to lapse. Move the revision so every browser that
            // has the old answer is sent the new one.
            $revision = $this->moved();
            $key = 'live-edit.team.state.'.$this->site->id.'.'.$revision;
        }

        $state = $this->compute($revision);
        Cache::put($key, $state, 86400);

        return $state;
    }

    /** The live lock on a unit, or null. Read from the cached state. */
    public function holderOf(string $unit): ?array
    {
        foreach ($this->state()['locks'] as $lock) {
            if ($lock['unit'] === $unit) {
                return $lock;
            }
        }

        return null;
    }

    /** @return array<int, string> the units this person holds right now */
    public function unitsHeldBy(Person $person): array
    {
        if (! $person->isSomeone()) {
            return [];
        }

        return $this->locks()->where('holder', $person->id)->where('last_active_at', '>=', $this->cutoff())->pluck('unit')->all();
    }

    /** @return array<string, array{holder: string, name: string}> unit => live lock, read fresh */
    public function liveLocks(): array
    {
        return $this->locks()->where('last_active_at', '>=', $this->cutoff())->get()
            ->mapWithKeys(fn (SectionLock $l) => [$l->unit => ['holder' => $l->holder, 'name' => (string) $l->holder_name]])
            ->all();
    }

    public function revision(): string
    {
        return (string) Cache::rememberForever('live-edit.team.rev.'.$this->site->id, fn () => Str::random(12));
    }

    /** Something about who holds what has changed: every browser should be told. */
    public function moved(): string
    {
        $revision = Str::random(12);
        Cache::forever('live-edit.team.rev.'.$this->site->id, $revision);

        return $revision;
    }

    /** Clear locks nobody has touched for longer than the limit. For the schedule, not for a request. */
    public static function prune(): int
    {
        $cutoff = now()->subMinutes(self::idleMinutes());
        $sites = SectionLock::query()->where('last_active_at', '<', $cutoff)->distinct()->pluck('site_id');
        $gone = SectionLock::query()->where('last_active_at', '<', $cutoff)->delete();

        foreach ($sites as $siteId) {
            Cache::forever('live-edit.team.rev.'.$siteId, Str::random(12));
        }

        return $gone;
    }

    /** @return array<string, mixed> */
    public function describe(SectionLock $lock): array
    {
        return [
            'unit' => $lock->unit,
            'label' => $lock->label ?: LockUnit::fallbackLabel($lock->unit),
            'holder' => $lock->holder,
            'name' => (string) $lock->holder_name,
            'role' => $lock->holder_role,
            'since' => $lock->claimed_at?->toIso8601String(),
            'active_at' => $lock->last_active_at?->toIso8601String(),
            'lapses_at' => $lock->last_active_at?->copy()->addMinutes(self::idleMinutes())->toIso8601String(),
            'taken_from' => $lock->taken_from,
            'taken_from_name' => $lock->taken_from_name,
        ];
    }

    /** @return array{revision: string, locks: array, left: array, valid_until: ?int} */
    private function compute(string $revision): array
    {
        $cutoff = $this->cutoff();
        $live = $this->locks()->where('last_active_at', '>=', $cutoff)->orderBy('unit')->get();
        $locks = $live->map(fn (SectionLock $l) => $this->describe($l))->values()->all();
        $heldBy = $live->pluck('holder', 'unit')->all();

        $left = $this->drafts()
            ->whereNotNull('unit')
            ->whereNotNull('author')
            ->selectRaw('unit, max(unit_label) as unit_label, author, max(author_name) as author_name, count(*) as changes')
            ->groupBy('unit', 'author')
            ->get()
            ->reject(fn ($row) => ($heldBy[$row->unit] ?? null) === $row->author)
            ->map(fn ($row) => [
                'unit' => $row->unit,
                'label' => $row->unit_label ?: LockUnit::fallbackLabel($row->unit),
                'author' => $row->author,
                'name' => (string) $row->author_name,
                'changes' => (int) $row->changes,
            ])
            ->values()
            ->all();

        $soonest = $live->min(fn (SectionLock $l) => $l->last_active_at?->getTimestamp());

        return [
            'revision' => $revision,
            'idle_minutes' => self::idleMinutes(),
            'locks' => $locks,
            'left' => $left,
            'valid_until' => $soonest === null ? null : (int) $soonest + self::idleMinutes() * 60,
        ];
    }

    /** Whether the lock on $unit is already this person's (renewing it if a minute has passed). */
    private function keep(Person $person, string $unit): bool
    {
        if (Cache::add($this->touchKey($person), true, 60)) {
            $this->locks()->where('holder', $person->id)->update(['last_active_at' => now()]);
        }

        return $this->locks()->where('unit', $unit)->where('holder', $person->id)->exists();
    }

    /** @return array<int, array{author: string, name: string, changes: int}> */
    private function leftBehind(Person $person, string $unit): array
    {
        return $this->drafts()->where('unit', $unit)
            ->whereNotNull('author')
            ->where('author', '!=', $person->id)
            ->selectRaw('author, max(author_name) as name, count(*) as changes')
            ->groupBy('author')
            ->get()
            ->map(fn ($row) => ['author' => (string) $row->author, 'name' => (string) $row->name, 'changes' => (int) $row->changes])
            ->all();
    }

    private function refusal(Person $person, ?SectionLock $lock): LockRefused
    {
        if ($lock === null) {
            // Released between the two statements: say so plainly, the editor tries again.
            return new LockRefused('Someone was just working here. Please try again.', [], 'retry');
        }

        $described = $this->describe($lock);
        $label = $described['label'];

        if ($lock->taken_from === $person->id) {
            return new LockRefused("{$described['name']} took over {$label}. Your changes there are now theirs to publish.", $described, 'taken_over');
        }

        $name = $described['name'] !== '' ? $described['name'] : 'Someone';
        $advice = $person->mayManage() ? 'You can take it over.' : 'Ask an admin to take over if it cannot wait.';

        return new LockRefused("{$name} is editing {$label} right now. {$advice}", $described, 'locked');
    }

    private function label(string $unit, ?string $label): string
    {
        $label = trim((string) $label);

        return $label !== '' ? mb_substr($label, 0, 191) : LockUnit::fallbackLabel($unit);
    }

    private function cutoff(): CarbonInterface
    {
        return now()->subMinutes(self::idleMinutes());
    }

    private function touchKey(Person $person): string
    {
        return 'live-edit.team.touch.'.$this->site->id.'.'.$person->id;
    }

    private function locks()
    {
        return SectionLock::query()->where('site_id', $this->site->id);
    }

    private function drafts()
    {
        return Draft::query()->where('site_id', $this->site->id);
    }
}
