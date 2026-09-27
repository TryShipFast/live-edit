<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Sign in to edit {{ $site->name }}</title>

    {{--
        Self-contained, deliberately.

        This page is served by the licensing service and is the first thing a
        customer sees of us after their own website. It cannot depend on an
        asset build, a CDN or a font host: a sign-in that renders unstyled
        because a request somewhere was slow looks like a phishing page, which
        is the one impression this page cannot afford.

        The palette is the editor's own, so the bar that appears after signing
        in is plainly the same product. Blue belongs to Publish and appears
        nowhere here — the one irreversible, outward-facing action in the
        product owns that colour, and spending it on a sign-in button would
        make it ordinary.
    --}}
    <style>
        :root {
            --ink: #0B0C0F;
            --body: #45484F;
            --muted: #9A9DA5;
            --line: #E6E7EA;
            --field: #DADCE0;
            --soft: #F4F5F7;
            --danger: #C0392B;
            --shadow: 0 30px 80px -28px rgba(11, 12, 15, .28);
        }

        * { box-sizing: border-box; }

        html, body { height: 100%; }

        body {
            margin: 0;
            background: var(--soft);
            color: var(--body);
            font: 400 15px/1.55 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            display: grid;
            place-items: center;
            padding: 32px 20px;
        }

        .card {
            width: 100%;
            max-width: 392px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 14px;
            box-shadow: var(--shadow);
            padding: 36px 32px 32px;
        }

        .mark {
            width: 38px; height: 38px;
            border-radius: 11px;
            background: var(--ink);
            display: grid; place-items: center;
            margin-bottom: 22px;
        }

        h1 {
            margin: 0 0 6px;
            font-size: 21px;
            line-height: 1.25;
            font-weight: 600;
            color: var(--ink);
            letter-spacing: -0.01em;
        }

        .sub { margin: 0 0 26px; font-size: 14px; color: var(--muted); }
        .sub strong { color: var(--body); font-weight: 500; }

        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--ink);
            margin-bottom: 6px;
        }

        input[type=email], input[type=password] {
            width: 100%;
            padding: 10px 12px;
            font: inherit;
            font-size: 14px;
            color: var(--ink);
            background: #fff;
            border: 1px solid var(--field);
            border-radius: 9px;
            transition: border-color .12s ease, box-shadow .12s ease;
        }

        input:focus {
            outline: none;
            border-color: var(--ink);
            box-shadow: 0 0 0 3px rgba(11, 12, 15, .08);
        }

        .field + .field { margin-top: 16px; }

        button {
            width: 100%;
            margin-top: 24px;
            padding: 11px 16px;
            font: inherit;
            font-size: 14px;
            font-weight: 500;
            color: #fff;
            background: var(--ink);
            border: 0;
            border-radius: 9px;
            cursor: pointer;
            transition: opacity .12s ease;
        }

        button:hover { opacity: .88; }
        button:active { opacity: 1; }

        .error {
            margin: 0 0 20px;
            padding: 10px 12px;
            font-size: 13.5px;
            color: var(--danger);
            background: rgba(192, 57, 43, .07);
            border: 1px solid rgba(192, 57, 43, .18);
            border-radius: 9px;
        }

        .foot {
            margin: 26px 0 0;
            padding-top: 18px;
            border-top: 1px solid var(--line);
            font-size: 12.5px;
            color: var(--muted);
        }

        .foot a { color: var(--body); text-decoration: none; border-bottom: 1px solid var(--line); }
        .foot a:hover { color: var(--ink); }

        @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
        }
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

        <h1>Sign in to edit</h1>
        <p class="sub">You are editing <strong>{{ $site->name }}</strong>.</p>

        @if ($error)
            {{-- One message for every kind of failure. Saying which half was
                 wrong turns this into a way to ask whose addresses are real. --}}
            <p class="error" role="alert">{{ $error }}</p>
        @endif

        <form method="post" action="{{ route('live-edit.sign-in.submit') }}">
            @csrf
            <input type="hidden" name="site" value="{{ $site->slug }}">
            <input type="hidden" name="return_to" value="{{ $returnTo }}">

            <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="username"
                       value="{{ $email }}" required autofocus spellcheck="false">
            </div>

            <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password"
                       autocomplete="current-password" required>
            </div>

            <button type="submit">Sign in</button>
        </form>

        <p class="foot">
            Only people added as editors of this site can sign in.
            <a href="https://tryshipfast.com" rel="noopener">ShipFast Live</a>
        </p>
    </main>
</body>
</html>
