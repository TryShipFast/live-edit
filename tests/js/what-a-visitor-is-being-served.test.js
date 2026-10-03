import { describe, expect, it } from 'vitest';
import { contentConfigFor } from '../../resources/js/session.js';

/**
 * "You cannot see what a visitor currently sees."
 *
 * Raised twice in the same week from opposite directions - as a missing view
 * by somebody installing the product, and as a worry by somebody who had just
 * published and wanted to be sure it had taken. Both ended up loading the site
 * signed out, in a private window, to find out. A publishing tool that cannot
 * show you what it published is asking to be checked somewhere else.
 *
 * Preview answers "what will this look like". Nothing answered "what is out
 * there", because an editor is shown their own unpublished work everywhere -
 * correctly, and with no way off it.
 *
 * The fix is to ask the way a stranger asks, which is a decision this one
 * function already owns. Worth testing here rather than through the panel:
 * what makes the answer trustworthy is that there is no second path to keep
 * honest, so the view cannot drift into showing something no visitor gets.
 */
const SITE = { api: 'https://live.example.com/api/v1', site: 'acme', key: 'kbp_public', snapshot: 'https://cdn.example.com/acme', locale: null };

describe('what a visitor is being served', () => {
    it('asks with the publishable key when there is no session', () => {
        const asked = contentConfigFor(SITE, null);

        expect(asked.key).toBe('kbp_public');
        expect(asked.snapshot).toBe('https://cdn.example.com/acme');
    });

    it('asks with the session token while editing, which is how drafts arrive', () => {
        /*
         * The behaviour being stepped off, not around. Reading with the
         * publishable key hands the person who just saved the same page every
         * visitor gets - their words replaced by the published ones, with
         * nothing to say why.
         */
        const asked = contentConfigFor(SITE, 'kbs_session');

        expect(asked.key).toBe('kbs_session');
        expect(asked.snapshot).toBeNull();
    });

    it('asks exactly as a stranger would when the token is set aside', () => {
        // What "What's live" does: the same call, with the session dropped.
        const stranger = contentConfigFor(SITE, null);
        const asVisitor = contentConfigFor(SITE, undefined);

        expect(asVisitor).toEqual(stranger);
        expect(asVisitor.key).toBe('kbp_public');
    });

    it('keeps the snapshot, which is the file a visitor is actually served', () => {
        /*
         * Not a detail. A snapshot holds published content only and is what a
         * CDN hands out; asking the API instead could answer correctly and
         * still not be what is being served, if the files are behind.
         */
        expect(contentConfigFor(SITE, null).snapshot).toBe('https://cdn.example.com/acme');
    });

    it('still names the site and the locale, so it is the same page', () => {
        const asked = contentConfigFor({ ...SITE, locale: 'fr' }, null);

        expect(asked.site).toBe('acme');
        expect(asked.base).toBe('https://live.example.com/api/v1');
        expect(asked.locale).toBe('fr');
    });
});
