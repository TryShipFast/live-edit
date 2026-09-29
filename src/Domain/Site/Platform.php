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
    /**
     * Whether this adapter is finished enough to be sold as finished.
     *
     * React and Next.js are not, and the reason is specific rather than a
     * general nervousness: the codemod tags a JSX element whose only child is
     * a plain string, which is the correct rule, and it means anything
     * rendered from an array is untouched. On a real page that is the
     * catalogue cards, the categories, the quick links and the testimonials,
     * which is most of what a visitor reads.
     *
     * Said here rather than in a marketing decision somewhere, so that
     * anybody choosing a platform is told at the moment they choose. Selling
     * it as equal to Laravel and WordPress and letting a customer discover
     * the gap on their own site is the expensive way for them to find out.
     *
     * See LIMITATIONS.md: "Anything inside a .map() is not editable".
     */
    public function isPreview(): bool
    {
        return $this === self::React || $this === self::NextJs;
    }

    /**
     * Whether this kind of site keeps its client's words in its own database.
     *
     * WordPress does, since its plugin took ownership of content, history,
     * pictures and styling. Laravel always did: the package runs inside the
     * application and writes to its tables. For those two the service holds no
     * content at all, so it cannot say what is waiting to be published, and a
     * dashboard that prints "nothing waiting" is stating something it does not
     * know. The honest answer there is to say where the answer lives.
     *
     * The others have no data layer of their own, which is the deliberate
     * shape of the framework-agnostic product: the service holds their words,
     * so it can answer.
     */
    public function keepsItsOwnContent(): bool
    {
        return $this === self::WordPress || $this === self::Laravel;
    }

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
            self::NextJs => 'A Next.js site, with the app or pages router. Headings and standalone text are editable; lists built from data are not yet.',
            self::React => 'A React app built with Vite or Create React App. Headings and standalone text are editable; lists built from data are not yet.',
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
