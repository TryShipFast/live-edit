<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Signing in…</title>

    {{--
        A doorway, not a page.

        Nobody should read this. It exists because the session arrives in the
        URL fragment, which a browser never sends to a server — that is the
        whole reason it is put there, so a freshly minted session stays out of
        access logs and out of Referer headers. Only a page can see it, so
        this is the smallest page that can.

        Styled all the same, because "smallest" is not an excuse for a white
        flash of unstyled text on the way into somebody's own website. Same
        palette as the editor and the sign-in page.
    --}}
    <style>
        body {
            margin: 0; height: 100vh;
            display: grid; place-items: center;
            background: #F4F5F7; color: #9A9DA5;
            font: 400 14px/1.5 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
        }
        .box { text-align: center; }
        .mark {
            width: 38px; height: 38px; border-radius: 11px; background: #0B0C0F;
            display: grid; place-items: center; margin: 0 auto 16px;
        }
        a { color: #45484F; }
    </style>
</head>
<body>
    <div class="box">
        <div class="mark" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 32 32">
                <rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#fff" stroke-width="2.5"/>
                <path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#1B6EF3" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
            </svg>
        </div>
        <p id="say">Signing you in…</p>
        <noscript><a href="{{ $signInUrl }}">Continue to sign in</a></noscript>
    </div>

    <script>
        (function () {
            var signIn = @json($signInUrl);
            var home = @json($destination);
            var say = document.getElementById('say');

            var match = window.location.hash.match(/(?:^#|&)kb_session=([^&]+)/);

            if (!match) {
                // Nothing to redeem, so this is the way out rather than the
                // way back. Replace, so the browser's back button does not
                // bounce the person straight out again.
                window.location.replace(signIn);
                return;
            }

            // Taken out of the address before anything else happens: a session
            // sitting in the URL is one screenshot or shared link away from
            // being somebody else's.
            var token = decodeURIComponent(match[1]);
            history.replaceState(null, '', window.location.pathname + window.location.search);

            // And the fragment is emptied outright. replaceState alone left it
            // in the address bar on the way through, so the token arrived at
            // the destination still visible, which is the one thing putting it
            // in a fragment was meant to avoid.
            if (window.location.hash) {
                window.location.hash = '';
            }

            fetch('{{ route('live-edit.session.store') }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // Same-origin POST, so it is held to the host's CSRF
                    // protection like any other form on the site.
                    'X-CSRF-TOKEN': @json(csrf_token())
                },
                credentials: 'same-origin',
                body: JSON.stringify({ token: token })
            })
                .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
                .then(function () {
                    // Absolute, so nothing of this URL travels with it. A
                    // relative replace resolves against an address that still
                    // carries the session.
                    window.location.replace(new URL(home, window.location.origin).href);
                })
                .catch(function () {
                    say.textContent = 'That sign-in could not be completed.';
                    say.insertAdjacentHTML('afterend', '<p><a href="' + signIn + '">Try again</a></p>');
                });
        })();
    </script>
</body>
</html>
