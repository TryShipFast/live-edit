<?php

namespace ShipFast\LiveEdit\Domain\Content;

use Illuminate\Validation\ValidationException;

/**
 * What a style may set, and what a value is allowed to be.
 *
 * These rules lived inside the editor's own controller, which was fine while
 * that was the only way in. It stops being fine the moment the HTTP API can
 * write a style too, because they are not tidiness: a background is rendered
 * into CSS url(), and a value carrying a quote or a bracket closes the url()
 * and continues as a stylesheet on every visitor's page.
 *
 * So they live here, and both ways in ask the same object — the same reasoning,
 * and the same shape, as EditPolicy.
 */
class StylePolicy
{
    /**
     * The props the site declares, narrowed to the ones given and checked.
     *
     * A prop that is not declared is dropped rather than refused: the panel
     * shows whatever the element allows, and an element that allows fewer
     * props than another is not an error to report to the person using it.
     * A declared prop with a value that is not allowed IS refused, because
     * silently dropping it would look like a save that did nothing.
     *
     * @param  array<string, string|null>  $props
     * @return array<string, string>
     *
     * @throws ValidationException
     */
    public function clean(array $props): array
    {
        $allowed = (array) config('live-edit.style_props');
        $clean = [];

        foreach (array_intersect_key($props, $allowed) as $prop => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            throw_unless(
                $this->permits((string) $allowed[$prop], (string) $value),
                ValidationException::withMessages(['props' => "Invalid value for {$prop}."])
            );

            $clean[$prop] = (string) $value;
        }

        return $clean;
    }

    /** Whether a value is allowed for a prop of this type. */
    public function permits(string $type, string $value): bool
    {
        return match ($type) {
            'color' => (bool) preg_match('/^#[0-9A-Fa-f]{3,8}$/', $value),
            'px' => ctype_digit($value) && (int) $value <= 400,
            'toggle' => $value === '1',
            // An image URL rendered into CSS url(): http(s) or a site-root
            // path only, and no character that could close the url() and
            // carry on as a stylesheet.
            'url' => (bool) preg_match('#^(https?://|/)[^\s\'"()\\\\]+$#', $value),
            default => false,
        };
    }

    /** Whether this key names something that can carry a style. */
    public function permitsKey(string $key): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9._-]{1,120}$/', $key);
    }
}
