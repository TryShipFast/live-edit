<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Too many attempts</title>

    {{-- Same palette and the same self-contained rule as the sign-in page it
         replaces. Somebody meets this page at their most irritated moment, so
         it should at least look like the product they are locked out of. --}}
    <style>
        :root { --ink: #0B0C0F; --body: #45484F; --muted: #9A9DA5; --line: #E6E7EA; --soft: #F4F5F7; }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            margin: 0; background: var(--soft); color: var(--body);
            font: 400 15px/1.55 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            display: grid; place-items: center; padding: 32px 20px;
        }
        .card {
            width: 100%; max-width: 392px; background: #fff;
            border: 1px solid var(--line); border-radius: 14px;
            box-shadow: 0 30px 80px -28px rgba(11, 12, 15, .28);
            padding: 36px 32px 32px;
        }
        .mark {
            width: 38px; height: 38px; border-radius: 11px; background: var(--ink);
            display: grid; place-items: center; margin-bottom: 22px;
        }
        h1 { margin: 0 0 6px; font-size: 21px; line-height: 1.25; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }
        p { margin: 0 0 14px; font-size: 14px; }
        .when { color: var(--ink); font-weight: 500; }
        .foot { margin: 26px 0 0; padding-top: 18px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
    </style>
</head>
<body>
    <main class="card">
        <div class="mark" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 32 32">
                <rect x="3" y="3" width="20" height="20" rx="3" fill="none" stroke="#fff" stroke-width="2.5"/>
                <path d="M16 15 L16 30 L19.6 26.4 L22.2 31.2 L24.6 30 L22 25.3 L27 25.3 Z" fill="#1B6EF3" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
            </svg>
        </div>

        <h1>Too many attempts</h1>

        <p>
            For safety we stop accepting sign-ins for a while after several failed ones.
            Nothing is wrong with your account.
        </p>

        <p>
            Try again
            @if ($minutes <= 1)
                <span class="when">in about a minute</span>.
            @else
                <span class="when">in about {{ $minutes }} minutes</span>.
            @endif
        </p>

        <p class="foot">
            If you have forgotten your password, ask whoever manages this site to set you a new one.
        </p>
    </main>
</body>
</html>
