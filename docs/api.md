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

## A site that is just files

A server-rendered site has something that can tag its markup and substitute
words before the page is sent. A folder of HTML on a CDN has neither, so it
needs two things — and until both existed, "static sites are supported" was
true of the engine and false of anything a customer could run.

**Tag it once**, with the same scanner every other adapter uses:

```bash
vendor/bin/kb-tag public            # show what would change
vendor/bin/kb-tag public --write    # apply it
```

Keys are written into the files and never regenerated: a second run leaves
tagged pages alone, so re-running cannot orphan a client's saved words. Keys
are scoped by page, so the same heading on two pages stays two things.

**Then let the page fetch its own content:**

```html
<script>
  window.liveEditContent = { snapshot: 'https://cdn.acme.com/content/sites/acme' };
</script>
<script type="module" src="/editor/content.js"></script>
```

It reads the published **files**, not the application: the pointer, cached for
seconds, then the version, cached forever. No key is needed, because published
content is what every visitor is being shown anyway. That is the whole point of
publishing to files — a busy site is served from an edge and never reaches the
application, so its traffic costs its owner nothing and costs you nothing.
Reading through the API instead would put every page view of every customer
back through one server.

Give it `base`, `site` and `key` as well and the API is used as a fallback, for
a site that has not published yet.

That is a separate, small file from the editor, because every visitor loads it
and almost none of them will ever edit anything. Published values are written
as text, never as markup — a content service that can put HTML into a page is
a way to run scripts in every visitor's browser.

The words in the file are what shows if the service is slow or unreachable, so
a static site degrades to exactly what it was before.

**The files must allow cross-origin reads.** The page is on the customer's
domain and the files are on a CDN, so the browser will not read them unless the
bucket says it may — and a blocked fetch looks like an ordinary network error,
so the symptom is a page that quietly shows its original words forever.

```json
[{ "AllowedOrigins": ["https://acme.com"], "AllowedMethods": ["GET", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
```

The alternative is to serve the files from the site's own domain — a CDN path
such as `/content/*` pointed at the bucket — and then no CORS is involved at
all. That is the tidier answer where the customer controls their edge.

**What still needs a server.** Minting an edit session, and publishing, both
need the secret key, and a folder of files has nowhere to keep one. A static
customer needs a single small function — on Netlify, Vercel, Workers, anywhere
— that checks whoever is asking and calls `POST /{site}/sessions`. Without it
a static site can be read and rendered, but not edited.

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

## Published files

Publishing writes each site's content as files that never change again, under
its own directory:

```
{snapshot dir}/sites/{slug}/current.json      the pointer — the only thing that moves
{snapshot dir}/sites/{slug}/v{n}/{locale}.json  a version, safe to cache forever
```

That is what makes the promise true. A customer's pages are read far more often
than they are written, and reading them through this application makes every
visitor depend on it being up and quick. A file can be taken by a CDN, a build
or a server renderer without asking anything — and if this service is down, the
last publish keeps serving. It is also what makes the pricing honest: a site
served from an edge costs almost nothing to keep running.

```
GET /{site}/versions       the pointer and every version, with addresses
POST /{site}/restore       {"version": 3} — secret key, like publishing
```

Restoring is applied forward rather than rewound: the restore becomes the
newest version, so history stays append-only and undoing a bad rollback is the
same operation again. One site can never restore from another's history, even
by asking for a version number that exists elsewhere.

A site that has never published has no files, so the database answers and
nothing changes for it. Removing a site removes its published files too — a
departed customer's words in a bucket are data nobody has a right to hold, and
a CDN would happily keep serving them.

## Usage and limits

Billing needs a number that can be defended, so each site's use is counted per
month:

```
GET  /sites/{slug}/usage            what this month cost
GET  /sites/{slug}/usage?period=2026-03   what March cost
PATCH /sites/{slug}  {"limits": {"writes": 5000, "bytes_stored": 524288000}}
```

**Saves, publishes and uploads are counted. Reads are not.** Reads are cached
and served from a CDN and never touch this application on a busy site —
charging for them would bill a customer for the work done to avoid work, and
quietly punish the sites that behave best.

Counts are per month because an invoice is for a month and a total cannot be
un-added; "what did we use in March" has to be a row rather than a
reconstruction. Stored bytes are the exception and accumulate, because storage
is what a customer pays to keep regardless of when they uploaded it.

Counters move by atomic increment, never read-then-write: two editors saving at
the same moment must not each read 4 and both write 5.

A site over a limit gets **402**, not 403 or 429. Nothing is wrong with the
request and trying again will not help — the account needs attention, and the
other two codes send a caller looking for a bug that is not there. A refused
save is not counted, and a refused upload is rejected before the file is
written, since storage already spent costs the same whether the response was
200 or not.

A site with no limits set is never refused. A limit nobody configured must
never be the reason a customer cannot save their own words.

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
