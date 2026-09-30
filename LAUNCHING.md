# Putting Live Edit on a customer's site

Written for the person doing the install, whether that is us, an agency, or the
site owner following along. Four ways in, one idea behind all of them: the site
stays exactly where it is, and editing arrives as a small addition to it.

Nothing here asks a customer to move hosting, change their stack, or learn a
dashboard.

## Before anything: register the site

Everything below needs two values, and both come from the same place.

1. Sign in at **live.tryshipfast.com** and add the site.
2. Give it the address the site is served from. `https://example.com` and
   `https://www.example.com` are different to a browser, so add both if both
   answer.
3. Copy the **site id** and the **publishable key**.

The key is meant to be public. It appears in the page source on every install
below, and it can only read what is already published. The secret key, if one
is issued, never goes near a browser.

**Then verify the domain.** The console gives a meta tag or a file to place.
Until that is done the site can be registered by anybody who knows the address,
and the licence is not bound to the site it belongs to.

---

## WordPress

1. In the console, open the site and press **Download plugin**.
2. In WordPress: **Plugins → Add New → Upload Plugin**, choose the zip,
   activate.
3. **Settings → Live Edit**, paste the site id and the publishable key, save.

That is the whole install. From then on the plugin keeps itself current: it
asks the service on WordPress's own schedule, and an update appears on the
Plugins screen like any other, with the site's own "update now" button.

The plugin deliberately does not touch posts, pages or anything WordPress
already edits well. It is for the words in the theme - a hero headline, a
strapline, the words on a button - which otherwise mean editing PHP.

## Laravel

```
composer require shipfast/live-edit
```

In `.env`:

```
LIVE_EDIT_CLOUD_HOST=https://live.tryshipfast.com
LIVE_EDIT_CLOUD_SITE=your-site-id
```

Add `@liveEdit` before `</body>` in the layout.

Those two variables are what decide where the words live. **Set, and the
service holds the content** - the application needs no database of its own for
this, which is the arrangement for an API-driven or statically-built frontend.
**Unset, and the content lives in the host's own database**, which is the
arrangement for a site that already has one and wants to keep everything.

A site that is not registered shows whoever installed it a strip saying so,
linking to the page that fixes it. It does not fail silently and it does not
stop the website.

## Next.js and React

```
npm install @shipfasts/live-edit-react
npx live-edit-codemod src --write
```

The codemod reads the project and makes the static copy in it editable,
choosing the right shape per file: components that render in the browser get a
hook, server components get a component that reads the words on the server. It
works out which is which from the whole project rather than one file's first
line, because a component with no `'use client'` still renders in the browser
if something client imports it.

Read the diff before committing. It is written to be readable.

In `.env`:

```
LIVE_EDIT_SITE=your-site-id
LIVE_EDIT_API_BASE=https://live.tryshipfast.com/api/live-edit/v1
LIVE_EDIT_KEY=your-publishable-key
```

Then wrap the app in `LiveEditProvider`, as the package README shows.

**What the codemod tells you and you should read:** it prints any list it could
not make editable, by file and component name. A list whose rows are a
component in another file, rendered on the server, is the one case it cannot
reach today - the workaround is in the message.

## A site that is only HTML

One tag before `</body>`:

```html
<script src="https://live.tryshipfast.com/s/your-site-id.js" defer></script>
```

Nothing to install and nothing to build. This is also the fallback for a stack
with no adapter: anything that serves HTML can be edited this way.

---

## Then: does it work

Three checks, in this order, because each one rules out the failure below it.

**1. Is the script on the page?** View source and look for it. If it is missing
the tag was not added, or a cache is serving an older page.

**2. Is it running?** Open the browser console. The commonest reason a correct
install does nothing is a **Content Security Policy**: the site lists the hosts
it will run scripts from, ours is not on the list, and the browser downloads
the file and then refuses to run it. Nothing errors visibly. The signature is a
`<script>` that fires `error` while `fetch()` of the same address returns 200.

The console reads the site's policy and says so on the site's settings page.
If it reports a problem, add `live.tryshipfast.com` to `script-src` **and**
`connect-src` - the script and the calls it makes are two separate permissions,
and fixing only the first gives an editor that loads and can read nothing.

**3. Can you edit?** Open the site with `?kb-enter=1` on the end, sign in, and
click a heading. Then **save, reload, and look again** - an edit that appears
and does not survive a reload has gone into the page rather than into the
content.

## Handing it over

The person who owns the site signs in at live.tryshipfast.com, not at
wp-admin and not at an account on their own site. They get an email, they set a
password, and from then on they visit their own website and edit it.

Worth saying to them once, because it is the thing that surprises people: there
is no dashboard to learn. They go to their site, they click the words, they
change them.
