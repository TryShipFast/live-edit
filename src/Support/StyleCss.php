<?php

namespace ShipFast\LiveEdit\Support;

use ShipFast\LiveEdit\Models\ElementStyle;

/**
 * Renders the stored per-element style overrides (ElementStyle rows keyed by a
 * `data-style` value) into a CSS block. `!important` lets a saved value beat the
 * host's utility classes. Any host can drop the output into its <head>.
 */
class StyleCss
{
    public static function render(array $drafts = [], ?array $published = null): string
    {
        $css = '';

        // The published set is supplied by whoever is serving the page, which
        // is how it comes from a snapshot rather than a query. Reading the
        // table is the fallback for a caller that has not been told.
        $styles = collect($published ?? ElementStyle::query()->pluck('props', 'key')->all())
            ->map(fn ($props, $key) => new ElementStyle(['key' => $key, 'props' => $props]));

        // Unpublished styling sits on top for whoever may see it, keyed the
        // same way, so a draft replaces its published counterpart entirely
        // rather than merging property by property.
        foreach ($drafts as $key => $props) {
            $styles[$key] = new ElementStyle(['key' => $key, 'props' => $props]);
        }

        foreach ($styles as $style) {
            $selector = '[data-style="'.$style->key.'"]';
            $rules = '';

            foreach ((array) $style->props as $prop => $value) {
                if ($value === '' || $value === null) {
                    continue;
                }

                if ($prop === 'hidden') {
                    $css .= "body:not(.editing) {$selector}{display:none !important}";
                    $css .= "body.editing {$selector}{opacity:.45}";

                    continue;
                }

                $rules .= match ($prop) {
                    // Wins over a theme's own stylesheet rule, which is the only
                    // way to restyle a background set by a CSS class.
                    'backgroundImage' => "background-image:url('{$value}') !important;"
                        .'background-size:cover !important;background-position:center !important;',
                    'background' => "background:{$value} !important;",
                    'textColor' => "color:{$value} !important;",
                    'fontSize' => "font-size:{$value}px !important;",
                    'radius' => "border-radius:{$value}px !important;",
                    'paddingX' => "padding-left:{$value}px !important;padding-right:{$value}px !important;",
                    'paddingY' => "padding-top:{$value}px !important;padding-bottom:{$value}px !important;",
                    default => '',
                };
            }

            if ($rules !== '') {
                $css .= "{$selector}{{$rules}}";
            }
        }

        return $css;
    }
}
