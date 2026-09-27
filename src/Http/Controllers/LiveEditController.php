<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Domain\Content\EditPolicy;
use ShipFast\LiveEdit\Domain\Content\ImageStore;
use ShipFast\LiveEdit\Domain\Content\StylePolicy;
use ShipFast\LiveEdit\Models\Draft;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Models\ElementStyle;
use ShipFast\LiveEdit\Support\DraftStore;

/**
 * ShipFast live-edit CMS: generic, config-driven endpoints for editing a
 * site's content in place. All editable content is declared in
 * config/live-edit.php; nothing project-specific lives here.
 *
 * Every write records its before-state as an EditRevision (grouped per
 * request into a batch) so the toolbar's Undo can restore the last change.
 */
class LiveEditController extends Controller
{
    protected function settingModel(): string
    {
        return config('live-edit.setting_model');
    }

    public function updateSetting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:200'],
            'value' => ['nullable', 'string', 'max:10000'],
            'locale' => ['nullable', 'string', 'in:'.implode(',', array_keys(config('live-edit.locales', [])))],
        ]);

        // These rules are shared with the HTTP API rather than repeated: a
        // second way in that validated differently would be a way past.
        $policy = new EditPolicy;
        $value = $validated['value'] ?? '';
        $policy->assert($validated['key'], $value);

        $this->writeSetting($this->localeKey($validated['key'], $validated['locale'] ?? null), $value);

        return $this->saved();
    }

    public function updateRecord(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(config('live-edit.models')))],
            'id' => ['required', 'integer'],
            'fields' => ['required', 'array'],
            'fields.*' => ['nullable', 'string', 'max:10000'],
        ]);

        $definition = config('live-edit.models.'.$validated['type']);
        $record = $this->record($validated['type'], $validated['id']);
        $fields = array_intersect_key($validated['fields'], array_flip($definition['fields']));

        throw_if($fields === [], ValidationException::withMessages(['fields' => 'No editable fields given.']));
        throw_if(
            isset($fields['icon']) && ! in_array($fields['icon'], config('live-edit.icon_options'), true),
            ValidationException::withMessages(['fields' => 'Unknown icon.'])
        );

        foreach (config('live-edit.select_options') as $field => $options) {
            throw_if(
                isset($fields[$field]) && ! in_array($fields[$field], $options, true),
                ValidationException::withMessages(['fields' => "Invalid value for {$field}."])
            );
        }

        throw_if(
            isset($fields['href']) && $fields['href'] !== '' && ! preg_match('#^(/|\#|https?://)#', $fields['href']),
            ValidationException::withMessages(['fields' => 'Links must start with /, #, http:// or https://.'])
        );

        $this->remember('record-update', $validated['type'].':'.$record->getKey(), [
            'fields' => array_intersect_key($record->attributesToArray(), $fields),
        ]);
        $record->update($fields);

        return $this->saved();
    }

    public function createRecord(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(config('live-edit.models')))],
        ]);

        $definition = config('live-edit.models.'.$validated['type']);
        abort_unless($definition['creatable'] ?? false, 422, 'This content type cannot be added here.');

        $model = $definition['class'];
        $record = $model::query()->create([
            ...$definition['defaults'] ?? [],
            'sort' => ($model::query()->max('sort') ?? 0) + 1,
        ]);

        $this->remember('record-create', $validated['type'].':'.$record->getKey(), null);
        $this->saved();

        return response()->json(['ok' => true, 'id' => $record->getKey()]);
    }

    public function moveRecord(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:'.implode(',', array_keys(config('live-edit.models')))],
            'id' => ['required', 'integer'],
            'direction' => ['required', 'in:up,down'],
        ]);

        $record = $this->record($validated['type'], $validated['id']);
        $model = config('live-edit.models.'.$validated['type'])['class'];

        $neighbour = $model::query()
            ->when(
                $validated['direction'] === 'up',
                fn ($query) => $query->where('sort', '<', $record->sort)->orderByDesc('sort'),
                fn ($query) => $query->where('sort', '>', $record->sort)->orderBy('sort'),
            )
            ->first();

        if ($neighbour === null) {
            return response()->json(['ok' => true, 'moved' => false]);
        }

        $type = $validated['type'];
        $this->remember('record-update', $type.':'.$record->getKey(), ['fields' => ['sort' => $record->sort]]);
        $this->remember('record-update', $type.':'.$neighbour->getKey(), ['fields' => ['sort' => $neighbour->sort]]);

        [$record->sort, $neighbour->sort] = [$neighbour->sort, $record->sort];
        $record->save();
        $neighbour->save();

        $this->saved();

        return response()->json(['ok' => true, 'moved' => true]);
    }

    public function deleteRecord(string $type, int $id): JsonResponse
    {
        $definition = config('live-edit.models.'.$type);
        abort_unless($definition && ($definition['deletable'] ?? false), 422, 'This content type cannot be deleted here.');

        $record = $this->record($type, $id);
        $this->remember('record-delete', $type, ['attributes' => $record->attributesToArray()]);
        $record->delete();

        return $this->saved();
    }

    public function updateImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target' => ['required', 'string'],
            // No SVG: it can embed scripts and would be served from our origin.
            'file' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp,avif', 'max:6144'],
            'url' => ['nullable', 'url:http,https', 'max:2000'],
            'fitWidth' => ['nullable', 'integer', 'min:1', 'max:4000'],
            'fitHeight' => ['nullable', 'integer', 'min:1', 'max:4000'],
            'alt' => ['nullable', 'string', 'max:300'],
            'imgTitle' => ['nullable', 'string', 'max:300'],
            'remove' => ['nullable', 'boolean'],
        ]);

        $hasImage = $request->hasFile('file') || filled($validated['url'] ?? null);
        $removing = (bool) ($validated['remove'] ?? false);

        throw_if(
            ! $hasImage && ! $removing && ! $request->has('alt') && ! $request->has('imgTitle'),
            ValidationException::withMessages(['file' => 'Upload a file, paste an image URL, or edit the text attributes.'])
        );

        [$type, $key] = explode(':', $validated['target'], 2) + [null, null];

        if ($type === 'setting') {
            // Same rule as a text setting: a named key must be declared, while
            // a scanner-generated auto:<hash> is accepted when the generic
            // store is on. Without this, images on an auto-tagged theme are
            // detected and shown as editable but every save is rejected.
            $isAutoKey = (bool) config('live-edit.auto_keys', false) && (bool) preg_match('/^auto:[a-f0-9]{6,64}$/', (string) $key);
            abort_unless($isAutoKey || in_array($key, config('live-edit.images', []), true), 422, 'Unknown image.');

            if ($removing) {
                $this->writeSetting($key, '');
                $this->writeSetting($key.'Credit', '');
                $this->writeSetting($key.'Href', '');
            } elseif ($hasImage) {
                $value = $request->hasFile('file')
                    ? $this->storeImage($request)
                    : $validated['url'];
                $this->writeSetting($key, $value);
                $this->writeSetting($key.'Credit', '');
                $this->writeSetting($key.'Href', '');
            }

            if ($request->has('alt')) {
                $this->writeSetting($key.'Alt', $validated['alt'] ?? '');
            }
            if ($request->has('imgTitle')) {
                $this->writeSetting($key.'Title', $validated['imgTitle'] ?? '');
            }
        } else {
            abort_if($removing, 422, 'Delete the item itself to remove this image.');
            abort_unless($hasImage, 422, 'Upload a file or paste an image URL.');
            $value = $request->hasFile('file')
                ? $request->file('file')->store(config('live-edit.directory'), config('live-edit.disk'))
                : $validated['url'];

            $definition = config('live-edit.models.'.$type);
            $imageField = $definition['image_field'] ?? null;
            abort_unless($imageField, 422, 'Unknown image target.');

            $record = $this->record($type, (int) $key);
            $fields = [$imageField => $value, 'credit' => '', 'credit_href' => ''];
            $this->remember('record-update', $type.':'.$record->getKey(), [
                'fields' => array_intersect_key($record->attributesToArray(), $fields),
            ]);
            $record->update($fields);
        }

        return $this->saved();
    }

    /**
     * Store an uploaded image and hand back its URL. Used by style fields that
     * take an image (a section background), where the value is a URL rather
     * than a setting — so an editor can upload a file instead of pasting a link.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'max:8192'],
            'fitWidth' => ['nullable', 'integer', 'min:1', 'max:4000'],
            'fitHeight' => ['nullable', 'integer', 'min:1', 'max:4000'],
        ]);

        $path = $this->storeImage($request);

        return response()->json([
            'url' => Storage::disk(config('live-edit.disk'))->url($path),
        ]);
    }

    /**
     * Store an uploaded image, sized to the box it is replacing.
     *
     * A client rarely has a picture the same shape as the one in the template.
     * Dropped in untouched it stretches the section it sits in and the design
     * they bought is spoiled, so the file is fitted to the original's box.
     */
    protected function storeImage(Request $request): string
    {
        // Shared with the HTTP API rather than repeated, and it is where the
        // fitting order is kept right: on a remote disk a stored path is a key
        // and not a file, so fitting afterwards silently did nothing.
        return (new ImageStore)->store(
            $request->file('file'),
            (int) $request->input('fitWidth', 0) ?: null,
            (int) $request->input('fitHeight', 0) ?: null,
        );
    }

    public function updateStyle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:120', 'regex:/^[A-Za-z0-9._-]+$/'],
            'props' => ['required', 'array'],
            'props.*' => ['nullable', 'string', 'max:2000'],
        ]);

        // The same object the HTTP API asks. These rules are not tidiness —
        // a background is rendered into CSS url(), and a value carrying a
        // quote closes it and continues as a stylesheet on every visitor's
        // page — so a second write path with its own copy is a hole that
        // would not look like one.
        $props = app(StylePolicy::class)->clean($validated['props']);

        if (DraftStore::enabled()) {
            DraftStore::put('style', $validated['key'], ['props' => $props]);

            return response()->json(['ok' => true, 'pending' => DraftStore::pending()]);
        }

        $existing = ElementStyle::query()->where('key', $validated['key'])->first();
        $this->remember('style', $validated['key'], [
            'props' => $existing?->props,
            'existed' => $existing !== null,
        ]);

        if ($props === []) {
            ElementStyle::query()->where('key', $validated['key'])->delete();
        } else {
            ElementStyle::query()->updateOrCreate(['key' => $validated['key']], ['props' => $props]);
        }

        return $this->saved();
    }

    /**
     * Put the held changes live.
     *
     * The count goes back so the editor can say what happened rather than just
     * claiming success.
     */
    /**
     * What is waiting to go live, for the review before it does.
     *
     * The same question the content API answers for a site we host, asked of
     * this application's own drafts. Without it the publish dialog opened,
     * said it could not list what was waiting, and offered to publish it
     * anyway, which is the one moment a client wants to see the list.
     */
    public function changes(): JsonResponse
    {
        abort_unless(DraftStore::enabled(), 404);

        $published = ($this->settingModel())::query()->pluck('value', 'key');

        $changes = Draft::query()
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Draft $draft) => [
                'key' => $draft->subject,
                'kind' => $draft->kind,
                'label' => $draft->subject,
                'before' => $draft->kind === 'setting' ? ($published[$draft->subject] ?? null) : null,
                'after' => $draft->kind === 'setting' ? ($draft->payload['value'] ?? null) : null,
                'at' => $draft->updated_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return response()->json(['changes' => $changes, 'count' => count($changes)])
            // One person's unfinished work. Nothing may hold it, anywhere.
            ->withHeaders(['Cache-Control' => 'no-store, private']);
    }

    /**
     * Take one change back before anybody sees it.
     *
     * The draft is deleted rather than overwritten with the old value, so
     * what remains is the published page exactly as it was. Writing the old
     * value back would leave a draft saying "make this what it already is",
     * which counts as a change and publishes as one.
     *
     * Named for what a client does rather than for the verb the route uses:
     * revert() here is already the undo stack's own helper, which puts a
     * published value back, and the two would be easy to confuse.
     */
    public function discardChange(Request $request): JsonResponse
    {
        abort_unless(DraftStore::enabled(), 404);

        $validated = $request->validate([
            'key' => ['required', 'string', 'max:200'],
            'kind' => ['nullable', 'string', 'max:40'],
        ]);

        Draft::query()
            ->where('kind', $validated['kind'] ?? 'setting')
            ->where('subject', $validated['key'])
            ->delete();

        return $this->saved();
    }

    public function publish(): JsonResponse
    {
        abort_unless(DraftStore::enabled(), 404);

        return response()->json(['ok' => true, 'published' => DraftStore::publish()]);
    }

    /** Throw the held changes away; the published site is untouched. */
    public function discardDraft(): JsonResponse
    {
        abort_unless(DraftStore::enabled(), 404);

        return response()->json(['ok' => true, 'discarded' => DraftStore::discard()]);
    }

    public function undo(): JsonResponse
    {
        $last = EditRevision::query()->latest('id')->first();

        if ($last === null) {
            return response()->json(['ok' => true, 'undone' => false]);
        }

        $rows = EditRevision::query()->where('batch', $last->batch)->orderByDesc('id')->get();

        foreach ($rows as $row) {
            rescue(fn () => $this->revert($row));
            $row->delete();
        }

        $this->saved();

        return response()->json(['ok' => true, 'undone' => true]);
    }

    protected function revert(EditRevision $row): void
    {
        [$type, $id] = explode(':', $row->subject, 2) + [null, null];

        match ($row->action) {
            'setting' => ($row->payload['existed'] ?? false)
                ? ($this->settingModel())::query()->where('key', $row->subject)->update(['value' => $row->payload['value'] ?? ''])
                : ($this->settingModel())::query()->where('key', $row->subject)->delete(),
            'record-update' => config("live-edit.models.{$type}.class")::query()
                ->whereKey((int) $id)->first()?->update($row->payload['fields'] ?? []),
            'record-create' => config("live-edit.models.{$type}.class")::query()
                ->whereKey((int) $id)->first()?->delete(),
            'record-delete' => tap(new (config("live-edit.models.{$row->subject}.class")))
                ->forceFill($row->payload['attributes'] ?? [])->save(),
            'style' => ($row->payload['existed'] ?? false)
                ? ElementStyle::query()->updateOrCreate(['key' => $row->subject], ['props' => $row->payload['props'] ?? []])
                : ElementStyle::query()->where('key', $row->subject)->delete(),
            default => null,
        };
    }

    /**
     * The stored key for a setting in a given locale. The default locale (and
     * a null locale) uses the bare key so the base site is untouched; every
     * other locale namespaces its value as "<locale>:<key>".
     */
    protected function localeKey(string $key, ?string $locale): string
    {
        $default = config('live-edit.default_locale');

        return ($locale === null || $locale === $default) ? $key : $locale.':'.$key;
    }

    protected function writeSetting(string $key, string $value): void
    {
        // With publishing on the change is held back rather than applied, so
        // the visitor keeps the published site until someone releases it.
        if (DraftStore::enabled()) {
            DraftStore::put('setting', $key, ['value' => $value]);

            return;
        }

        $existing = ($this->settingModel())::query()->where('key', $key)->first();
        $this->remember('setting', $key, [
            'value' => $existing?->value,
            'existed' => $existing !== null,
        ]);

        ($this->settingModel())::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    protected function remember(string $action, string $subject, ?array $payload): void
    {
        // Batch scoped to the request, not the controller: route objects cache
        // controller instances (tests, Octane), which would merge batches.
        $batch = request()->attributes->get('live-edit-batch');
        if ($batch === null) {
            $batch = (string) Str::uuid();
            request()->attributes->set('live-edit-batch', $batch);
        }

        EditRevision::query()->create([
            'batch' => $batch,
            'action' => $action,
            'subject' => $subject,
            'payload' => $payload,
        ]);

        $ceiling = (int) EditRevision::query()->max('id') - 300;
        if ($ceiling > 0) {
            EditRevision::query()->where('id', '<=', $ceiling)->delete();
        }
    }

    protected function record(string $type, int $id): Model
    {
        return config('live-edit.models.'.$type)['class']::query()->findOrFail($id);
    }

    protected function saved(): JsonResponse
    {
        if ($callback = config('live-edit.after_save')) {
            $callback();
        }

        return response()->json(['ok' => true]);
    }
}
