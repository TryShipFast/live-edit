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
    public static function render(): string
    {
        $css = '';

        foreach (ElementStyle::all() as $style) {
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
