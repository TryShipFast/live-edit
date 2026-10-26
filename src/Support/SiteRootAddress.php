<?php

namespace ShipFast\LiveEdit\Support;

/**
 * One address for a link every page of a site shares.
 *
 * A static site links relatively: the header's "Fees" is "fees/" on the home
 * page and "../fees/" one folder down. A host that keys such a link once for
 * every page cannot store either, so it marks the element with the way from
 * its page up to the site's root (data-edit-href-root: "" at the root, "../"
 * one folder down) and the editor saves an address chosen there from the root
 * ("~/fees/"). Written out here for the page it is applied on: the root's way
 * plus the rest.
 *
 * The browser applies the same rule (resources/js/site-address.js).
 */
final class SiteRootAddress
{
    /** What an address saved from the site's root begins with. */
    public const PREFIX = '~/';

    /** A saved address for the page it is applied on; anything not saved from the root, as it was saved. */
    public static function here(string $value, string $root): string
    {
        if (! str_starts_with($value, self::PREFIX)) {
            return $value;
        }

        $here = $root.substr($value, strlen(self::PREFIX));

        return $here === '' ? './' : $here;
    }
}
