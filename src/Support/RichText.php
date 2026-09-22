<?php

namespace ShipFast\LiveEdit\Support;

use Illuminate\Support\HtmlString;

/**
 * Markdown-lite for owner-editable copy: **bold**, *italic*, [text](url)
 * and line breaks. Safe by construction — the input is HTML-escaped first
 * and only these transforms introduce markup, so stored content can never
 * carry HTML through. Links are restricted to /, # and http(s) targets;
 * anything else renders as literal text.
 */
class RichText
{
    public static function render(?string $text): HtmlString
    {
        $safe = e($text ?? '');

        $safe = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $safe);
        $safe = preg_replace('/(?<!\*)\*([^*\n]+)\*(?!\*)/', '<em>$1</em>', $safe);

        $safe = preg_replace_callback('/\[([^\]\n]+)\]\(([^)\s]+)\)/', function (array $match): string {
            $href = $match[2];

            if (! preg_match('#^(/|\#|https?://)#', $href)) {
                return $match[0];
            }

            $external = str_starts_with($href, 'http');

            return '<a href="'.$href.'" class="underline decoration-brand/40 underline-offset-2 hover:decoration-brand"'
                .($external ? ' target="_blank" rel="noopener"' : '')
                .'>'.$match[1].'</a>';
        }, $safe);

        return new HtmlString(nl2br($safe, false));
    }
}
