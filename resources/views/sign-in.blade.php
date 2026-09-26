{{--
    The sign-in page, owned by the package.

    Self-contained on purpose: no layout of the host's, no stylesheet of the
    host's, no classes that assume Tailwind is present. A site that installs
    this package may have no design system, no components and no admin of its
    own, and this page still has to look deliberate on it.

    Nothing here says which product it belongs to beyond the site's own name.
    Somebody arriving at this page by accident should learn nothing except
    that it is not for them.
--}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ __('Sign in') }} · {{ config('app.name') }}</title>
    <style>
        :root {
            --ink: #0B0C0F;
            --body: #45484F;
            --muted: #9A9DA5;
            --line: #E6E7EA;
            --soft: #F4F5F7;
            --blue: #1B6EF3;
            --danger: #C0392B;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--soft);
            color: var(--body);
            font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            font-size: 15px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }
        .card {
            width: 100%;
            max-width: 380px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 30px 80px -30px rgba(11, 12, 15, .25);
        }
        h1 { margin: 0; font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -.01em; }
        .sub { margin: 6px 0 24px; font-size: 14px; color: var(--muted); }
        label { display: block; margin-bottom: 14px; font-size: 13px; font-weight: 600; color: var(--ink); }
        input[type=email], input[type=password] {
            width: 100%;
            margin-top: 6px;
            padding: 11px 13px;
            border: 1px solid #DADCE0;
            border-radius: 10px;
            font: inherit;
            color: var(--ink);
            background: #fff;
        }
        input:focus { outline: 1px solid var(--ink); border-color: var(--ink); }
        .remember { display: flex; align-items: center; gap: 8px; font-weight: 400; color: var(--body); }
        .remember input { margin: 0; }
        button {
            width: 100%;
            margin-top: 20px;
            padding: 12px 18px;
            border: 0;
            border-radius: 999px;
            background: var(--blue);
            color: #fff;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }
        button:hover { background: #145CD4; }
        .problem {
            margin-bottom: 18px;
            padding: 11px 13px;
            border-radius: 10px;
            background: rgba(192, 57, 43, .07);
            color: var(--danger);
            font-size: 14px;
        }
        .note { margin-bottom: 18px; padding: 11px 13px; border-radius: 10px; background: var(--soft); font-size: 14px; }
        .back { display: block; margin-top: 20px; text-align: center; font-size: 13px; color: var(--muted); text-decoration: none; }
        .back:hover { color: var(--ink); }
        @media (prefers-color-scheme: dark) {
            body { background: #0B0C0F; color: #C9CBD1; }
            .card { background: #16181D; border-color: #2A2C31; }
            h1 { color: #fff; }
            input[type=email], input[type=password] { background: #0B0C0F; border-color: #2A2C31; color: #fff; }
            input:focus { outline-color: #fff; border-color: #fff; }
            .note { background: #0B0C0F; }
        }
    </style>
</head>
<body>
    <main class="card">
        <h1>{{ __('Sign in to edit') }}</h1>
        <p class="sub">{{ config('app.name') }}</p>

        @if (session('live-edit-status'))
            <p class="note">{{ session('live-edit-status') }}</p>
        @endif

        @if ($errors->any())
            <p class="problem">{{ $errors->first() }}</p>
        @endif

        <form method="POST" action="{{ route('live-edit.sign-in.store') }}">
            @csrf
            <input type="hidden" name="back" value="{{ $back }}">

            <label>
                {{ __('Email') }}
                <input type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username">
            </label>

            <label>
                {{ __('Password') }}
                <input type="password" name="password" required autocomplete="current-password">
            </label>

            <label class="remember">
                <input type="checkbox" name="remember" value="1">
                {{ __('Stay signed in') }}
            </label>

            <button type="submit">{{ __('Sign in') }}</button>
        </form>

        <a class="back" href="{{ $back }}">{{ __('Back to the site') }}</a>
    </main>
</body>
</html>
