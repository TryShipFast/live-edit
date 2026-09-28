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
     * Who took the photograph in this style, kept beside it.
     *
     * A picture replaced on an element stores the photographer as settings
     * next to it, and the credits page reads them. The same photograph used as
     * a section background stored the address and nothing else, so the
     * photographer's name existed only in a toast that faded. Unsplash asks to
     * be credited and a Creative Commons licence requires it, which made the
     * default path - Openverse, for a customer with no key - the one carrying
     * the strongest obligation and the least information to meet it.
     *
     * These are never rendered as CSS. The renderer only knows the visual
     * props and ignores everything else, which is what lets them travel with
     * the style rather than needing a second store of their own.
     */
    public const CREDIT = ['credit', 'creditBy', 'creditUrl', 'creditSource', 'creditSourceUrl'];

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

        // Kept before the visual props are considered, because they are not
        // visual and the site does not declare them: they belong to whatever
        // photograph the style is carrying.
        foreach (self::CREDIT as $field) {
            if (! array_key_exists($field, $props)) {
                continue;
            }

            $said = trim((string) ($props[$field] ?? ''));

            if ($said === '') {
                continue;
            }

            throw_if(
                mb_strlen($said) > 300,
                ValidationException::withMessages(['props' => "Invalid value for {$field}."])
            );

            // The two that become links have to be addresses, for the same
            // reason a background does: they are rendered into a page.
            throw_if(
                str_ends_with($field, 'Url') && ! $this->permits('url', $said),
                ValidationException::withMessages(['props' => "Invalid value for {$field}."])
            );

            $clean[$field] = $said;
        }

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
