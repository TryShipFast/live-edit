/**
 * One address for a link every page of a site shares.
 *
 * A static site links relatively: the header's "Fees" is "fees/" on the home
 * page and "../fees/" one folder down. A host that keys such a link once for
 * every page (a shared header, a named menu entry) cannot store either of
 * those, because whichever page it was saved from, every other depth would be
 * sent somewhere that does not exist. So the host marks the element with the
 * way from its page up to the site's root (data-edit-href-root: "" at the
 * root, "../" one folder down), and an address the owner chooses there is
 * saved from the root instead ("~/fees/"), and written out for each page as it
 * is applied: the root's way plus the rest.
 *
 * The server applies the same rule (ShipFast\LiveEdit\Support\SiteRootAddress).
 */

/** What an address saved from the site's root begins with. */
export const FROM_THE_ROOT = '~/';

/**
 * A saved address, written for the page it is applied on: "~/fees/" with a
 * root of "../" is "../fees/". Anything else is returned as it was saved.
 */
export const addressHere = (value, root) => {
    if (typeof value !== 'string' || !value.startsWith(FROM_THE_ROOT)) return value;

    return `${root ?? ''}${value.slice(FROM_THE_ROOT.length)}` || './';
};

/**
 * The address to save for a link the owner pointed somewhere, from the page
 * they are on (`page`, the URL relative addresses resolve against).
 *
 * Only where the element says where the root is (`root` is not null or
 * undefined) and the address leads somewhere inside this site: a full address
 * (https:, mailto:, tel: and the like), one from the server's root ("/fees"),
 * a place on this page ("#top"), and one that climbs above the site are saved
 * exactly as typed, since each already means the same thing on every page.
 */
export const addressFromTheRoot = (href, root, page) => {
    if (root === null || root === undefined || typeof href !== 'string') return href;

    const typed = href.trim();

    if (typed === '' || typed.startsWith(FROM_THE_ROOT) || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(typed)) return href;

    try {
        const here = new URL(page);
        const site = new URL(root === '' ? './' : root, here);
        const target = new URL(typed, here);

        if (target.origin !== site.origin || !target.pathname.startsWith(site.pathname)) return href;

        return `${FROM_THE_ROOT}${target.pathname.slice(site.pathname.length)}${target.search}${target.hash}`;
    } catch {
        return href;
    }
};
