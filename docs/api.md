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
| `POST /media` | multipart `file`, optional `fitWidth`/`fitHeight` — returns a URL |
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

## Whose content is it

Content belongs to a site, not to the installation. Two customers can be served
from one deployment without either being able to reach the other's words,
drafts, versions or pictures — and the same key on both sites is two different
things, which matters because auto keys come from content signatures and two
sites running the same bought theme generate identical ones.

A bespoke Laravel site keeps using its own models; the whole point of those is
that they are the customer's own shape. These site-scoped tables are for sites
served over the API, where this installation holds content on their behalf.

Version numbers count per site, so every site has its own v1. A shared sequence
would leak how often other customers publish and make a rollback ambiguous.

Removing a site removes its content, in application code as well as by foreign
key — SQLite does not enforce foreign keys by default and neither do some MySQL
configurations, and leaving a departed customer's words behind is not a
tidiness problem but data nobody has a right to hold.

## Images

`POST /media` takes a file and answers with a URL. What comes back is an
address; what is stored against a key is the object's path. Keeping those apart
matters — a URL saved where a key belongs works until the first caller that
needs a key.

**Fitted before it is stored, never after.** A client rarely has a picture the
same shape as the one in the template, and dropped in untouched it stretches the
section it sits in. The fitter needs a real file, and on a bucket a stored path
is a key rather than a location — so fitting after storing silently did nothing
and the picture arrived at its original size. An upload is always a local
temporary file, so that is where the work happens.

**Stored with the headers a CDN needs**, at the moment it is written. An object
is served by the distribution without passing through this application again, so
anything not said at upload time cannot be said later. Names are random, which
means a given URL is that picture forever and a year-long immutable cache is
safe: replacing an image writes a new object rather than overwriting one.

```
LIVE_EDIT_MEDIA_URL=https://cdn.example.com   # the distribution in front of the bucket
LIVE_EDIT_MAX_UPLOAD_KB=8192
```

Accepted: JPG, PNG, GIF, WebP, AVIF, SVG. Anything else is refused by name — a
file claiming to be an image because its declared type says so does not get into
a bucket something else may be willing to execute.

**An SVG is rebuilt before it is stored**, not on the way out. It is a document
rather than a picture: it can carry script, handlers and remote references. A
file served straight from a CDN never passes through anything again, so it has
to be safe going in.

Uploads are counted on their own throttle, far tighter than a text save, because
one costs bandwidth, storage and CPU rather than a row.

## Provisioning

Creating sites and minting their keys, for whatever runs a signup. Behind a
different credential from anything a site holds, because it is a different kind
of power: a site's own keys reach that site's content, while these bring sites
into existence. Sharing one credential between them would mean a leak from any
customer's server could provision against everybody.

```
LIVE_EDIT_ADMIN_TOKEN=…
```

Empty — the default — and these endpoints are not merely forbidden but absent,
answering 404. That is right for the single-site installations that provision
from the console.

| | |
|---|---|
| `POST /sites` | `{slug, name?, origins?}` — creates the site and both keys |
| `GET /sites/{slug}` | origins, state, and key identities (never the keys) |
| `PATCH /sites/{slug}` | `{origins?, suspended?}` |
| `POST /sites/{slug}/keys` | `{type, label?}` — issue another |
| `DELETE /sites/{slug}/keys/{id}` | revoke one |

Both keys are created together, because a site with only one cannot be used:
the publishable key reads, and the secret vouches for editors. They are shown
once. Afterwards only their identities can be listed — a listing that leaked
them would make "shown once" decoration.

Rotation is issue-then-revoke rather than replace: the new key works
immediately and the old one keeps working until revoked, so a running site is
never without one mid-deploy.

Suspending stops every key at once without destroying anything, so a dispute or
a compromise can be halted and then put back exactly as it was.

Refused from a browser, whatever the credential. An `Origin` header means a
provisioning key is sitting in a page, and it is already lost.

An origin that is not an origin is refused rather than stored. Stored, it would
match nothing, and the symptom is a CORS error on the customer's own site that
looks like a bug in their page.
