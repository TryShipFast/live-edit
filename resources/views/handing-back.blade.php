<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Signing you in…</title>

    {{--
        A page, where a redirect would be simpler and does not work.

        Signing in has to end on the customer's own website, and the obvious
        way to do that is to answer the form POST with a 302. Browsers apply
        the `form-action` content-security directive to the whole redirect
        chain, not just the address the form names — so a service with a
        sensible `form-action 'self'` silently refuses to follow it. Nothing
        errors, no message reaches the person: the form simply sits there,
        which is the worst way for a sign-in to fail.

        The alternative would be naming every customer's domain in our own
        CSP, which is a list that grows with sales and breaks the moment it
        falls behind. A navigation started by script is not a form submission,
        so this hands over without asking the policy for permission.

        The session stays in the fragment for the same reason it always did:
        a fragment never reaches a server, so it stays out of access logs and
        out of Referer headers on the way.
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
        <p>Signing you in…</p>

        {{-- Without script there is no way to carry a fragment, so the link
             carries it instead. It is a click rather than a wait, but it is a
             working sign-in rather than a dead end. --}}
        <noscript><a href="{{ $returnTo }}">Continue to your site</a></noscript>
    </div>

    <script>
        // replace, not assign: the back button should return somebody to
        // their own site, not to a spent hand-over page.
        window.location.replace(@json($returnTo));
    </script>
</body>
</html>
