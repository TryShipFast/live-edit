<?php

namespace ShipFast\LiveEdit\Domain\Site;

/**
 * What a site is built with.
 *
 * Asked once, when the site is registered, because the answer never changes
 * on its own and a key belongs to one site. The console used to skip the
 * question and show every platform's instructions behind tabs, which reads as
 * "we do not know what you have, you work it out" at the exact moment
 * somebody is least equipped to.
 *
 * It decides which instruction is printed and nothing else. It is not a
 * permission, not a licence term, and never a reason to refuse a request: a
 * site that said WordPress and turns out to be running the plain script still
 * works, because the key is what we check and the key says nothing about this.
 */
enum Platform: string
{
    case WordPress = 'wordpress';
    case Laravel = 'laravel';
    case NextJs = 'nextjs';
    case React = 'react';
    case Html = 'html';

    /** How to say it to somebody, spelled the way they spell it. */
    public function label(): string
    {
        return match ($this) {
            self::WordPress => 'WordPress',
            self::Laravel => 'Laravel',
            self::NextJs => 'Next.js',
            self::React => 'React',
            self::Html => 'Plain HTML',
        };
    }

    /** A sentence somebody can recognise their own site in. */
    public function describes(): string
    {
        return match ($this) {
            self::WordPress => 'A WordPress site, with wp-admin and plugins.',
            self::Laravel => 'A Laravel application, with Blade templates.',
            self::NextJs => 'A Next.js site, with the app or pages router.',
            self::React => 'A React app built with Vite or Create React App.',
            self::Html => 'Hand written HTML files, or anything we have not named.',
        };
    }

    /**
     * Take whatever was submitted and return a platform or nothing.
     *
     * Nothing is a real answer here. The sites registered before the question
     * existed have no value and must not be given one by guessing: a site
     * quietly recorded as WordPress would be handed a plugin it cannot use.
     */
    public static function clean(?string $value): ?string
    {
        return self::tryFrom(strtolower(trim((string) $value)))?->value;
    }
}
