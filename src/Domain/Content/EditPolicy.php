<?php

namespace ShipFast\LiveEdit\Domain\Content;

use Illuminate\Validation\ValidationException;

/**
 * What may be written, and what a value is allowed to contain.
 *
 * These rules used to live inside the editor's own controller. That was fine
 * while the editor was the only way in; it stops being fine the moment an HTTP
 * API can write too, because the rules are not merely tidiness — refusing
 * "javascript:" in a link is what stops an edit becoming script execution in
 * every visitor's browser. A second write path that skipped them would be a
 * hole straight past the protection, and it would not look like one.
 *
 * So they live here, and both ways in ask the same object.
 */
class EditPolicy
{
    /**
     * Whether this key may be written at all.
     *
     * A declared key is on the site's allowlist. An auto:<hash> key comes from
     * the scanner and is accepted without being declared, which is what lets a
     * whole theme be editable without hand-listing every element — but only
     * when the site has turned that on.
     */
    public function permitsKey(string $key): bool
    {
        if (in_array($key, config('live-edit.settings', []), true)) {
            return true;
        }

        return (bool) config('live-edit.auto_keys', false)
            && (bool) preg_match('/^auto:[a-f0-9]{6,64}$/', $key);
    }

    /**
     * @throws ValidationException
     */
    public function assertKey(string $key): void
    {
        throw_unless($this->permitsKey($key), ValidationException::withMessages(['key' => 'Unknown setting.']));
    }

    /**
     * @throws ValidationException
     */
    public function assertValue(string $key, string $value): void
    {
        $isLink = str_ends_with($key, 'Href')
            || (str_starts_with($key, 'social') && ! str_ends_with($key, 'Target'));

        throw_if(
            $isLink && $value !== '' && ! preg_match('#^(/|\#|https?://)#', $value),
            ValidationException::withMessages(['value' => 'Links must start with /, #, http:// or https://.'])
        );

        throw_if(
            str_ends_with($key, 'Target') && ! in_array($value, ['', '_blank'], true),
            ValidationException::withMessages(['value' => 'Invalid link target.'])
        );

        // An embed or a media source ends up as a src the browser will fetch or
        // run. Anything but http(s) — javascript:, data: — is a script waiting
        // for a visitor.
        $isMedia = str_ends_with($key, 'Embed') || str_ends_with($key, 'Src');

        throw_if(
            $isMedia && $value !== '' && ! preg_match('#^https?://#', $value),
            ValidationException::withMessages(['value' => 'Media links must start with http:// or https://.'])
        );
    }

    /**
     * @throws ValidationException
     */
    public function assert(string $key, string $value): void
    {
        $this->assertKey($key);
        $this->assertValue($key, $value);
    }

    /** "fr:heroTitle" for a translation, "heroTitle" for the default locale. */
    public function localeKey(string $key, ?string $locale): string
    {
        $default = config('live-edit.default_locale', 'en');

        return $locale === null || $locale === '' || $locale === $default ? $key : $locale.':'.$key;
    }
}
