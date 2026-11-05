<?php

namespace ShipFast\LiveEdit\Domain\Team;

/**
 * Which part of a site a change belongs to, for "one person per section".
 *
 * A lock unit is the thing one person holds while they work:
 *
 *   section:<instance>        a Kit section on a page (data-instance / data-edit-section),
 *                             for example "section:home.hero"
 *   site/<instance>           a band shared by every page, for example "site/header"
 *   panel:brand               the Brand panel (colours, name, logo, contact details)
 *   panel:seo:<page>          one page's search and sharing settings
 *   panel:shop                the Shop tab (terms, WhatsApp number, products)
 *   collection:<id>           one search collection, with all of its pages of records
 *   form:<key>                one form the owner shapes
 *   arrangement:<page>        one page's arrangement (sections added, moved, hidden)
 *   pages                     the list of pages (adding, renaming, removing a page)
 *   area:<id>                 a part of a page that is not a Kit section but has an id
 *   key:<key>                 one element on a site with no sections at all
 *
 * The key decides first where its shape says what it is (a form, a collection,
 * an arrangement), so a stale or careless browser cannot file those under the
 * wrong unit. Everything else uses the unit the editor declared, which it reads
 * from the page the person clicked.
 */
final class LockUnit
{
    private const DECLARED = '/^(section:|site\/|panel:|collection:|form:|arrangement:|area:|key:|pages$)[^\s]{0,180}$/';

    public static function resolve(string $key, ?string $declared): ?string
    {
        if (str_starts_with($key, 'form:')) {
            return mb_substr($key, 0, 191);
        }

        if (str_starts_with($key, 'collection:')) {
            $id = explode(':', substr($key, strlen('collection:')))[0];

            return $id === '' ? null : 'collection:'.$id;
        }

        if (str_starts_with($key, 'structure:page:')) {
            return mb_substr('arrangement:'.substr($key, strlen('structure:page:')), 0, 191);
        }

        if ($key === 'structure:pages' || $key === 'structure:removed') {
            return 'pages';
        }

        $declared = trim((string) $declared);

        return $declared !== '' && preg_match(self::DECLARED, $declared) === 1 ? $declared : null;
    }

    /** A name for a unit nobody labelled, so a sentence never shows "section:home.hero". */
    public static function fallbackLabel(string $unit): string
    {
        return match (true) {
            $unit === 'pages' => 'Pages',
            $unit === 'panel:brand' => 'Brand',
            $unit === 'panel:shop' => 'Shop',
            str_starts_with($unit, 'panel:seo') => 'Search and sharing',
            str_starts_with($unit, 'collection:') => 'Collection '.substr($unit, 11),
            str_starts_with($unit, 'form:') => 'Form',
            str_starts_with($unit, 'arrangement:') => 'Page layout',
            str_starts_with($unit, 'site/') => ucfirst(str_replace(['site/', 'site.'], '', $unit)),
            str_starts_with($unit, 'section:') => ucfirst(str_replace(['-', '_'], ' ', (string) preg_replace('/^.*\./', '', substr($unit, 8)))),
            default => 'This part of the page',
        };
    }
}
