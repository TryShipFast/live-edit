<?php

namespace ShipFast\LiveEdit\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use ShipFast\LiveEdit\Models\EditRevision;
use ShipFast\LiveEdit\Models\ElementStyle;

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

        // A named key must be on the allowlist; an auto:<hash> key from the
        // scanner is accepted without config when the generic store is on, so
        // a whole theme is editable without hand-declaring every element.
        $key = $validated['key'];
        $isAutoKey = (bool) config('live-edit.auto_keys', false) && (bool) preg_match('/^auto:[a-f0-9]{6,64}$/', $key);
        throw_unless(
            $isAutoKey || in_array($key, config('live-edit.settings', []), true),
            ValidationException::withMessages(['key' => 'Unknown setting.'])
        );

        $value = $validated['value'] ?? '';

        $isLinkKey = str_ends_with($validated['key'], 'Href')
            || (str_starts_with($validated['key'], 'social') && ! str_ends_with($validated['key'], 'Target'));
        throw_if(
            $isLinkKey && $value !== '' && ! preg_match('#^(/|\#|https?://)#', $value),
            ValidationException::withMessages(['value' => 'Links must start with /, #, http:// or https://.'])
        );
        throw_if(
            str_ends_with($validated['key'], 'Target') && ! in_array($value, ['', '_blank'], true),
            ValidationException::withMessages(['value' => 'Invalid link target.'])
        );

        // A media embed (iframe/video src) must be a real http(s) URL — never a
        // javascript: or data: URI that would run in the page.
        $isMediaKey = str_ends_with($validated['key'], 'Embed') || str_ends_with($validated['key'], 'Src');
        throw_if(
            $isMediaKey && $value !== '' && ! preg_match('#^https?://#', $value),
            ValidationException::withMessages(['value' => 'Media links must start with http:// or https://.'])
        );

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
            abort_unless(in_array($key, config('live-edit.images'), true), 422, 'Unknown image.');

            if ($removing) {
                $this->writeSetting($key, '');
                $this->writeSetting($key.'Credit', '');
                $this->writeSetting($key.'Href', '');
            } elseif ($hasImage) {
                $value = $request->hasFile('file')
                    ? $request->file('file')->store(config('live-edit.directory'), config('live-edit.disk'))
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
        ]);

        $path = $request->file('file')->store(
            config('live-edit.directory'),
            config('live-edit.disk')
        );

        return response()->json([
            'url' => Storage::disk(config('live-edit.disk'))->url($path),
        ]);
    }

    public function updateStyle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:120', 'regex:/^[A-Za-z0-9._-]+$/'],
            'props' => ['required', 'array'],
            'props.*' => ['nullable', 'string', 'max:2000'],
        ]);

        $allowed = config('live-edit.style_props');
        $props = [];

        foreach (array_intersect_key($validated['props'], $allowed) as $prop => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $valid = match ($allowed[$prop]) {
                'color' => (bool) preg_match('/^#[0-9A-Fa-f]{3,8}$/', $value),
                'px' => ctype_digit($value) && (int) $value <= 400,
                'toggle' => $value === '1',
                // An image URL rendered into CSS url(): http(s) or a site-root
                // path only, and no characters that could break out of url().
                'url' => (bool) preg_match('#^(https?://|/)[^\s\'"()\\\\]+$#', $value),
                default => false,
            };

            throw_unless($valid, ValidationException::withMessages(['props' => "Invalid value for {$prop}."]));

            $props[$prop] = $value;
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
