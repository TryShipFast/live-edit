/**
 * The one line a customer pastes.
 *
 *   <script src="https://cms.example.com/live-edit/embed.js"
 *           data-site="acme" data-key="kbp_…" defer></script>
 *
 * Everything else is loaded by this, from the same place, so a customer never
 * copies a file and never has to copy it again when a release goes out. That
 * matters more than it sounds: four files copied by hand into a site is a
 * version nobody can update, multiplied by every customer.
 *
 * Deliberately a classic script rather than a module, because a module has no
 * document.currentScript and so cannot read its own tag — and reading the
 * configuration off the tag is what makes this one line instead of three.
 *
 * What every visitor downloads is this and the content applier: a page's worth
 * of words, and no editor. The editor is fetched only for somebody who is
 * actually editing, which is almost nobody.
 */
(function () {
    var tag = document.currentScript;

    if (!tag) {
        return;
    }

    var here = new URL(tag.src, window.location.href);
    // Siblings live under assets/, so this works whether the tag points at
    // /live-edit/embed.js or at a CDN path ending the same way.
    var base = here.href.replace(/\/embed\.js.*$/, '/assets/');

    var config = {
        site: tag.dataset.site,
        key: tag.dataset.key,
        api: tag.dataset.api || here.origin + '/api/live-edit/v1',
        snapshot: tag.dataset.snapshot || null,
        locale: tag.dataset.locale || null,
    };

    if (!config.site) {
        console.warn('[live-edit] no data-site on the embed tag; nothing to do.');

        return;
    }

    window.liveEditContent = {
        // The files first, and the application only if a site has not
        // published yet. A busy site should never reach the application.
        snapshot: config.snapshot,
        base: config.api,
        site: config.site,
        key: config.key,
        locale: config.locale,
    };

    window.liveEditApi = { base: config.api, site: config.site, token: null };

    var load = function (file) {
        return import(base + file);
    };

    // A page nobody prepared has to be told what is editable before anything
    // can be put into it, so that comes first — and only for such a page.
    var ready = document.querySelector('[data-edit], [data-edit-img]')
        ? Promise.resolve()
        : load('autotag.js')
            .then(function (m) { return m.autoTag({ base: config.api, site: config.site, key: config.key }); })
            .catch(function (error) {
                console.warn('[live-edit] could not tag this page:', error.message);
            });

    // Words next. A visitor waits for nothing else.
    ready.then(function () { return load('content.js'); });

    load('session.js').then(function (session) {
        var token = session.currentSession(window);

        // Someone who has just followed a link from their inbox, or who was
        // already editing in this tab. Anyone else gets no editor at all.
        var wants = token || /[?&]edit(=1)?(&|$)/.test(window.location.search);

        if (!wants) {
            return;
        }

        if (token) {
            window.liveEditApi.token = token;
        }

        document.body.setAttribute('data-admin', '');

        return load('live-edit.js');
    }).catch(function (error) {
        // The page is the point; the editor is not. A visitor must never see
        // a broken site because an editor failed to load.
        console.warn('[live-edit] editor unavailable:', error.message);
    });
})();
