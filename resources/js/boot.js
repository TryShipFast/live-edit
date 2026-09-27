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
    // Carried through to the files this loads, so one version of the runtime
    // is one set of addresses.
    var version = here.searchParams.get('v') || '';
    // Siblings live under assets/, so this works whether the tag points at
    // /live-edit/embed.js or at a CDN path ending the same way.
    //
    // The version goes in the PATH. A module's static imports resolve against
    // its own URL and do not inherit its query string, so a version carried as
    // "?v=" reached only the files named here — their imports were fetched
    // from an unversioned address and could come from cache, giving a new
    // editor beside an old helper. A directory is inherited for free.
    var base = here.href.replace(/\/embed\.js.*$/, '/assets/') + (version ? encodeURIComponent(version) + '/' : '');

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

    window.liveEditApi = { base: config.api, site: config.site, token: null };

    var load = function (file) {
        return import(base + file);
    };

    /**
     * Do nothing to this page until it has finished loading itself.
     *
     * The editor mounts off this attribute. Setting it the moment the script
     * runs is right on a page the server rendered and finished with, and
     * catastrophic on a hydrating one: React compares the markup it rendered
     * on the server against the DOM it finds, sees an attribute that was not
     * in the server's output, decides the tree cannot be trusted and bails
     * out of hydrating ALL of it. The page goes blank. Not the editor — the
     * customer's entire website, for the one person holding a session.
     *
     * Measured on a Next.js 16 app router template: one attribute, set a
     * moment too early, emptied every page.
     *
     * So nothing this runtime writes lands before load, by which point React
     * has hydrated and is watching the DOM rather than comparing it against
     * the server's. A page with no React is unaffected: it has already fired
     * load, and the work runs at once.
     *
     * One rule in one place, because it is not one attribute. data-admin
     * marks the body; the tagger writes data-edit, data-style and data-kb-bg
     * across the page. Every one of them is an attribute React did not
     * render, and any single one is enough for it to give up on the tree.
     */
    var onceTheDomIsOurs = function (work) {
        if (document.readyState === 'complete') {
            return Promise.resolve(work());
        }

        return new Promise(function (resolve) {
            window.addEventListener('load', function () {
                // A frame after load, not during it: hydration can still be
                // finishing in the same task, and waiting one costs nothing.
                (window.requestAnimationFrame || setTimeout)(function () {
                    resolve(work());
                });
            }, { once: true });
        });
    };

    // Whoever is here decides what the page should ask for: an editor sees
    // their own unpublished work, a visitor sees the published files.
    load('session.js').then(function (session) {
        var token = session.currentSession(window);

        /*
         * The way in, for a site that has nowhere else to put one.
         *
         * WordPress has a plugin that can answer a URL and Laravel has a
         * route, so both could offer a door. A folder of HTML files has
         * neither, and until this there was no way for its owner to start
         * editing at all: the session arrives in a fragment, and nothing put
         * a fragment there. The person was expected to hand-assemble a
         * sign-in URL, which is not something to ask of somebody whose site
         * is three files and an FTP client.
         *
         * So: add ?kb-enter=1 to any page and it sends them to sign in and
         * brings them back to the page they were on. The same query the
         * plugin answers, so there is one thing to remember across all of
         * them.
         */
        if (!token && window.location.search.indexOf('kb-enter') !== -1) {
            var here = new URL(window.location.href);
            here.searchParams.delete('kb-enter');

            var plane = config.api.replace(/\/api\/live-edit\/v\d+\/?$/, '');

            window.location.replace(
                plane + '/live-edit/sign-in?site=' + encodeURIComponent(config.site)
                    + '&return_to=' + encodeURIComponent(here.href)
            );

            return;
        }

        window.liveEditContent = session.contentConfigFor(config, token);

        if (token) {
            window.liveEditApi.token = token;

            // Said out loud, because a React provider cannot be handed this:
            // the session arrives in a URL fragment and a fragment never
            // reaches the server that renders the props. Announced rather
            // than polled for, and after the assignment so anybody listening
            // finds it already there.
            window.dispatchEvent(new CustomEvent('live-edit:session'));
        }

        // A page nobody prepared has to be told what is editable before
        // anything can be put into it, so that comes first.
        //
        // Asked for every page, not only an untagged one: a page tagged on the
        // server still has its backgrounds to find, because those live in a
        // stylesheet and the server was reading markup. autoTag decides — it
        // returns immediately when there is nothing new to ask about.
        var tagging = { base: config.api, site: config.site, key: token || config.key };
        var editing = token || /[?&]edit(=1)?(&|$)/.test(window.location.search);

        var ready = load('autotag.js')
            .then(function (m) {
                return onceTheDomIsOurs(function () {
                    if (token) {
                        document.body.setAttribute('data-admin', '');
                    }

                    return m;
                });
            })
            .then(function (m) {
                // Backgrounds are watched as well as read, because a builder
                // loads a section's picture when it scrolls into view — but
                // only for somebody editing. A visitor has no use for a
                // background they cannot change and should not pay to watch
                // for it.
                return editing ? m.ensureBackgroundsAreFound(tagging) : m.autoTag(tagging);
            })
            .catch(function (error) {
                console.warn('[live-edit] could not tag this page:', error.message);
            });

        return ready
            .then(function () { return load('content.js'); })
            .then(function () {
                // The editor itself, only for somebody who is actually
                // editing, which is almost nobody.
                if (editing) {
                    return load('live-edit.js');
                }
            });
    }).catch(function (error) {
        // The page is the point; the editor is not.
        console.warn('[live-edit] editor unavailable:', error.message);
    });
})();
