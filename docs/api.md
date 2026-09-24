# HTTP API

For a site that is not this application: a WordPress plugin, a static build, a
React front end. Reading and writing content over HTTP, so nothing but this
service needs Laravel.

Off by default. Turn it on with `LIVE_EDIT_API=true`.

## Keys

Three kinds, and the difference is about where each may be kept.

| Kind | May | Lives |
|---|---|---|
| `kbp_` publishable | read | in the page — safe, because everything it can see is already public |
| `kbs_` secret | read, write, publish, mint sessions | on a server, never in a browser |
| `kbe_` session | read, write | in the page, briefly |

The editor runs inside the customer's own page, where anything it holds can be
read by anyone who opens the source. So a key that can change content never
reaches the browser. Instead their server — which has already decided the
person at the keyboard may edit, because their users are not ours — mints a
short-lived session key and hands that to the page. A session scraped out of a
page stops working on its own, and cannot renew itself: minting requires an
ability only secret keys hold.

A secret key presented with an `Origin` header is refused outright. An `Origin`
means a browser sent it, and a secret key in a browser is already compromised.

Only a hash of each key is stored. The plain text is shown once, when it is
created, and cannot be recovered.

```bash
php artisan live-edit:site create acme --origins=https://acme.com,https://*.acme.com
php artisan live-edit:site key acme --type=publishable
php artisan live-edit:site key acme --type=secret
php artisan live-edit:site list
php artisan live-edit:site revoke <public-id>
```

## Endpoints

All under `/api/live-edit/v1/{site}`, authenticated with `Authorization: Bearer <key>`.
Never in a query string — those end up in access logs and `Referer` headers.

| | |
|---|---|
| `GET /content?locale=en` | published settings and styles |
| `GET /content/version` | the current version number only |
| `POST /content` | `{key, value, locale?}` — one change |
| `POST /sessions` | `{label?}` — mint a session key (secret only) |
| `POST /publish` | release held changes as a new version (secret only) |

## Origins

A site lists the origins allowed to call from a browser. `https://*.acme.com`
covers one label of subdomain, not any depth, and not the bare domain.

This is not authentication — the key is. A browser sets `Origin` and a page
cannot forge it, but anything that is not a browser can send what it likes. It
is a blast radius: a publishable key that ends up somewhere it should not be
still only works from the pages its owner named.

**Watch for:** Laravel ships `config/cors.php` with `paths` of `api/*`, which
matches this prefix on a default install. Its CORS middleware would overwrite
these headers — including setting `Access-Control-Allow-Headers` to empty,
which makes a browser refuse to send `Authorization` at all, so the API would
work from curl and fail from every real page. This package registers its CORS
handling at the front of the global stack so it has the last word, and does not
depend on the host editing that config. Keeping this prefix out of `cors.paths`
is still tidier.

## Limits

Two windows per bucket, and a caller passes both. A short one sized for a person
editing in bursts, a long one for what a site really consumes in an hour: one
limit cannot do both jobs, since a limit low enough to stop a runaway script
would interrupt ordinary typing.

Counted per key where there is one and per address where there is not — and
always scoped to the site being called, so a flood aimed at one customer cannot
lock out another reached from the same address.

Every response carries `RateLimit-Limit`, `RateLimit-Remaining` and
`RateLimit-Reset`; a refusal is `429` with `Retry-After`.

## Caching

`GET /content` carries an `ETag`; send it back as `If-None-Match` and an
unchanged site answers `304` with no body.

What the tag is made of depends on the site. With publishing on it is the
version number, since a version never changes once written. With publishing off
a save is live immediately and no version moves, so the tag is taken from the
content itself — otherwise caches would hold a tag that never changed while the
words underneath it did.

`Cache-Control` pairs a short `max-age` with a long `stale-while-revalidate`, so
a busy site serves from its cache at once and refreshes behind the scenes.
