# @shipfasts/live-edit-react

In-place editing of the **static** content in React and Next.js apps: the words
and assets written in your templates, not data from your API or database.
Dynamic content stays yours.

Part of [ShipFast Live Edit](https://tryshipfast.com). The same editor serves
Laravel, WordPress and plain HTML. This is the React and Next.js adapter.

---

## Quick start

Five steps. The whole install.

**1. Install.**

```bash
npm install @shipfasts/live-edit-react
```

React 18 or 19, Node 18 or newer. ESM, no build step, so what you read in `src/`
is what your bundler sees.

**2. Set three environment variables**, from your ShipFast console.

```
NEXT_PUBLIC_LIVE_EDIT_SITE=acme
NEXT_PUBLIC_LIVE_EDIT_API_BASE=https://live.tryshipfast.com/api/live-edit/v1
NEXT_PUBLIC_LIVE_EDIT_KEY=kbp_...
```

**3. Wrap your app** in the provider. On the Next App Router this takes two
files, and there is no way around it (see
[The two files every Next install writes](#the-two-files-every-next-install-writes)).

**4. Add the overlay script** to your root layout. This is what draws the
toolbar and signs people in:

```html
<script src="https://live.tryshipfast.com/s/acme.js" defer></script>
```

**5. Make your pages editable** with the codemod:

```bash
npx live-edit-codemod .          # shows what it would do, changes nothing
npx live-edit-codemod . --write  # applies it
```

Then open your site with `?kb-enter=1` on the end. See
[Getting in the first time](#getting-in-the-first-time), because this is the one
step people miss.

## What an edited component looks like

```jsx
import { LiveEditProvider, useContent } from '@shipfasts/live-edit-react';

function Hero() {
  return <h1 data-edit="setting:auto:1a2b3c">{useContent('auto:1a2b3c', 'Original words')}</h1>;
}
```

The second argument is the words already in your component. That matters more
than it looks: the component renders its own copy with no provider, no network
and no content at all. Adding this cannot leave a page blank, and removing it
later leaves working code behind.

## Getting in the first time

Load your site and you will see nothing. **That is correct.** A visitor gets the
published words and no editor. There is no toolbar to look for.

To edit, arrive through the door:

```
https://your-site.test/?kb-enter=1
```

That sends you to the console to sign in and returns you to the page you were
on, with a session. The toolbar appears.

Two things must be true:

- the address is one the site's **allowed origins** include
- your account is allowed to edit that site in the console

A whole install was once checked over an afternoon and turned out to be working
the entire time. Every module loaded, eleven hundred elements tagged, not one
error anywhere. It looked like a failure only because nobody had opened that
door.

**If your dev server runs on a port the console does not know** (`:3001` when
`:3000` was registered), the content fetch is refused by CORS. The page still
works: it serves the words already in your components and logs
`[live-edit] serving the words already in the page`. Add the origin in the
console, or use the registered port.

## Client components and server components

They work differently, and the codemod picks the right one for each file.

| | Client component | Server component |
| --- | --- | --- |
| Import from | `@shipfasts/live-edit-react` | `@shipfasts/live-edit-react/server` |
| Reads words with | `useContent()` hook | `<LiveEditText>` or `liveEditWords()` |
| Edits appear | instantly, as you type | on the next render |

A server component renders once, on the server, so there is no React in the
browser holding its state.

```jsx
import { LiveEditText, liveEditWords } from '@shipfasts/live-edit-react/server';

// As a component, anywhere the words are, including inside a .map().
<p data-edit="setting:auto:1a2b3c">
  <LiveEditText contentKey="auto:1a2b3c" fallback="Original words" />
</p>

// Or as a lookup, if you would rather read them yourself.
const words = await liveEditWords();
<h1>{words('auto:1a2b3c', 'Original words')}</h1>
```

The `/server` entry reads three server-only variables. These are the three
values a site is given, under the same names the rest of the product uses:

```
LIVE_EDIT_SITE_ID=acme
LIVE_EDIT_HOST=https://live.tryshipfast.com
LIVE_EDIT_APP_KEY=kbp_...
```

The older `LIVE_EDIT_SITE`, `LIVE_EDIT_API_BASE` and `LIVE_EDIT_KEY` are still
read, so nothing already deployed has to change. `LIVE_EDIT_HOST` is a bare
host and the API path is appended for you; `LIVE_EDIT_API_BASE` is the full
path if you would rather give it.

**Without all three, nothing is read and every component renders its own
words.** That used to happen in silence, which is the worst way for it to
happen: the overlay applies published content after hydration, so you see your
own copy and have no reason to suspect anything, while crawlers and first paint
get the words in your components. It now says so in the console once, naming
the variable that is missing.

**`/server` is a separate entry point deliberately.** It holds your key, and an
import that cannot appear in a client bundle cannot leak one into a client
bundle. Never import `/server` from a component marked `'use client'`.

**It never throws.** No configuration, a timeout, an error, a login page where
JSON was expected: every one of them renders the words already written in your
component. Editing your content must never be able to take your site down.

## The two files every Next install writes

One file cannot work. `await readContent()` needs a server component and
`useRouter` needs `'use client'`, so they cannot live together.

**The layout stays a server component** and fetches the words, so they are in
the HTML that arrives:

```jsx
// app/layout.tsx
import { readContent } from '@shipfasts/live-edit-react/server';
import LiveEditProviderWrapper from './live-edit-provider';

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LiveEditProviderWrapper
          site={process.env.NEXT_PUBLIC_LIVE_EDIT_SITE}
          apiBase={process.env.NEXT_PUBLIC_LIVE_EDIT_API_BASE}
          publishableKey={process.env.NEXT_PUBLIC_LIVE_EDIT_KEY}
          content={await readContent()}
        >
          {children}
        </LiveEditProviderWrapper>
        <script src="https://live.tryshipfast.com/s/acme.js" defer />
      </body>
    </html>
  );
}
```

**The wrapper is the client half**, and exists only to hold the hook:

```jsx
// app/live-edit-provider.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LiveEditProvider, type ContentMap } from '@shipfasts/live-edit-react';

export default function LiveEditProviderWrapper({
  site, apiBase, publishableKey, content, children,
}: {
  site: string;
  apiBase: string;
  publishableKey: string;
  content: ContentMap;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <LiveEditProvider
      site={site}
      apiBase={apiBase}
      publishableKey={publishableKey}
      content={content}
      onRefresh={() => router.refresh()}
    >
      {children}
    </LiveEditProvider>
  );
}
```

`onRefresh` matters: after a save, an element inside a server component is not
being read by any hook, so the page is fetched again. `router.refresh()` does
that without a full navigation, keeping scroll position and open menus.

## The props

`site` and `apiBase` are required. Everything else has a sensible default.

| Prop | What it is for |
| --- | --- |
| `content` | the words, fetched on your server so they are in the first HTML |
| `publishableKey` | what the provider reads content with, if you do not pass `content` |
| `onRefresh` | how to re-render after a save, usually `router.refresh()` |
| `sessionKey` | you almost certainly do not need this |

**`content`**: leave it out and the provider fetches on mount, so the page paints
your original copy then repaints with the client's. Behind a login nobody minds.
On a public page they will, and a crawler that does not run JavaScript indexes
your template instead of the client's site. Pass it wherever you can render on
the server.

**`sessionKey`**: somebody signing in is handed their session in a URL fragment,
and a browser never sends a fragment to a server. So a server component cannot
know it and a prop threaded from one is always empty. The provider finds the
session itself. Pass this only if your own server mints sessions.

## Locking parts of the page

New in 0.14, and effective in React from 0.15.

Mark a region as yours rather than the client's:

```html
<nav data-live-lock> ... </nav>
```

A narrowed editor cannot change anything inside it. You still can.

### How it works here, and why that took a version

The lock used to be applied only by the engine's scanner as it discovered
editable elements: it skipped a locked region, so nothing inside ever became
editable. That works where the scanner tags the page, which is Laravel and
WordPress. React is tagged differently - `live-edit-codemod` writes `data-edit`
into your source at build time - so the markers are in the HTML before any
scanner sees it, and skipping a subtree does not remove a marker that is
already there.

Two things changed in 0.15:

- The lock is now checked when the change **arrives**, not only when the page
  is tagged. Declining to offer something is a guardrail; refusing to store it
  is the boundary. This closes every adapter at once, including ones that bake
  their own markers, because none of them can reach the store another way.
- A page that never tags now reports its own locks once per deploy, so there
  is something to refuse against. That request is automatic and carries only
  markup your publishable key already renders.

### What this means for you

Nothing, if you are already on `@shipfasts/live-edit-react` 0.15 or later and
your engine is 0.15 or later. Add the attribute and it holds.

Two things worth knowing:

- It binds from the first page view after a deploy, not from the build. The
  lock is recorded when a page that carries it is first loaded.
- A page reporting its locks can only ever **add** one. Taking a lock off
  needs a key that can write and has not been narrowed - yours, not your
  client's - so an invited editor cannot report the lock away and then write
  through the gap.

### The blunter alternative

If you would rather a region were never editable by anybody, including you,
leave it untagged. The codemod takes `--exclude`, repeatable, matched against
the path:

```bash
npx live-edit-codemod . --write --exclude "**/nav/**" --exclude "**/footer/**"
```

Nothing it never tagged can be edited at all. Removing the `data-edit` markers
it already wrote has the same effect.

## Which key is which

The prefix tells you, and it is the only thing that does.

| Prefix | What it is | Where it may go |
| --- | --- | --- |
| `kbp_` | publishable | the browser. Everything it reads is already public. |
| `kbs_` | secret | your server only. It mints sessions and publishes. |
| `kbe_` | session | minted by your server, short-lived, one person's browser. |

A `kbp_` key is the one that belongs in `NEXT_PUBLIC_...`. A `kbs_` key never
is, and the variable name is the test: if a bundler would inline it, it is the
wrong key.

The service enforces the origin allowlist and what each key may do, **not where
the key was sent from**. A secret key used from an allowed origin would work,
which is exactly why it must not be in a page. Keeping it off the page is a rule
you hold, not one held for you.

### Minting a session

Only if your own server decides who may edit:

```js
// app/api/live-edit-session/route.js
export async function POST() {
  const session = await auth();                    // YOUR check
  if (!session?.user?.canEdit) return new Response('no', { status: 403 });

  const res = await fetch(`${process.env.KB_API}/acme/sessions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KB_SECRET}` },  // server only
  });

  return Response.json(await res.json());
}
```

The page receives a short-lived, write-scoped key. Scraped out of the page it
expires on its own, and it cannot mint another.

## The codemod

```bash
npx live-edit-codemod .                      # dry run
npx live-edit-codemod . --write              # apply
npx live-edit-codemod components --write --client   # also make files client components
```

What it changes, and what it will not touch:

| | |
|---|---|
| `<h1>Northfield Studio</h1>` | tagged, and read from content |
| `<p>Hello {user.name}</p>` | left alone, built from your data |
| `<Button>Save</Button>` | left alone, text is a prop not a DOM node |
| already tagged | left alone, so a second run cannot orphan saved edits |

It reads `.js`, `.jsx`, `.mjs`, `.ts` and `.tsx`. JSX lives in `.js` as often as
in `.jsx`, so the extension is not taken as a guide. `.ts` is parsed without
JSX, because there `<T>value` is a type assertion and reading it as a tag turns
working code into a parse error.

Edits are made in the original source rather than reprinted from the syntax
tree, so the diff contains only what changed. A file that cannot be parsed is
reported and skipped, never guessed at.

Measured on two real templates: 88% of text-bearing elements on a marketing
landing page, 80% on a blog starter.

Most App Router projects are almost entirely server components, so by default
very little is live. `--client` converts the files it touches, adding the
directive along with the hook, and then every edit appears in place.

### Lists where the card is in its own file

The ordinary App Router shape: `posts.map(post => <PostPreview/>)` in one file,
the words in another. The codemod wires both sides, because neither file can see
the other.

```jsx
// more-stories.tsx
<PostPreview liveEditRow={itemIdentity(post)} key={post.slug} title={post.title} />

// post-preview.tsx
export default function PostPreview({ title, liveEditRow }) {
    return <h3 data-edit={editMarkerIn(liveEditRow, 'auto:1a2b3c')}>
        <LiveEditText contentKey="auto:1a2b3c" row={liveEditRow} fallback={title} />
    </h3>;
}
```

The key is the card's own; the row is composed onto it at render. So the same
component is ordinary content on its own page and per-row inside a list, decided
where it is rendered rather than where it is written. A client component needs
none of this: the identity travels in React context and `LiveEditItem` puts it
there.

Identity comes from the item's own data, never the React key, which is routinely
an array index and is not promised to survive a refetch.

Adding, removing and reordering rows needs a client component. The codemod tells
you which lists those are rather than passing over them quietly. A card it
cannot resolve to a file it is about to rewrite, from a package or behind an
import it cannot follow, is reported rather than wired, so it does not read as
coverage.

## Saving

Edits show immediately and save after a pause. One request per key per pause,
not one per keystroke. A failed save leaves the typed words on screen rather
than reverting, because silently restoring the old text is how somebody loses a
paragraph without being told.

## Troubleshooting

**Nothing is editable and there is no toolbar.** You have not opened the door.
Add `?kb-enter=1` to the URL.

**It takes ten seconds to become editable in development.** The overlay is
usually mounted with `strategy="afterInteractive"`, so the tag is injected only
once React has hydrated, and dev-server hydration is slow. Measured at 8.5s on a
real app. Build it first: `npm run build && npm start`. If it persists, move the
tag to `strategy="beforeInteractive"`.

**A published edit does not show in the HTML a crawler sees.** If a page renders
statically, `readContent()` runs at **build time** and its answer is baked in.
An incremental build does not pick content up, because content is not a source
file and nothing marks the prerender stale. A host that keeps `.next` between
deploys can serve the old copy indefinitely.

```
publish -> rebuild with a warm .next -> still the old words
publish -> rm -rf .next && rebuild   -> the new ones
```

So `readContent()` asks the service to be considered stale after a minute:

```js
{ next: { revalidate: 60 } }   // the default
```

In the App Router a route's revalidation period is the lowest of its fetches',
so every page that reads content gets incremental regeneration with no line
added to any of them. To choose differently:

```js
await readContent({ revalidate: 300 });   // five minutes
await readContent({ revalidate: false }); // never stored, renders per request
await readContent({ cache: 'force-cache' });
```

`revalidate: false` puts a fetch back on the request path. That is a supported
choice, not a trap: every call carries a timeout and `readContent()` never
rejects.

**The content fetch fails with "Failed to fetch".** The origin you are serving
from is not in the site's allowed list. See
[Getting in the first time](#getting-in-the-first-time).

## Why this package rarely changes

Worth knowing before reading a diff and concluding nothing was done.

This package is an adapter. It wires a React app to the service and never
carries the runtime, and there is a test in the engine whose whole job is to
fail if it ever starts to. So the two halves move at different rates:

| What changed | How it reaches you | Shows in this package? |
| --- | --- | --- |
| scanner, appliers, editor panel, preview | served by the service, automatically | **no** |
| provider, hooks, types, codemod | `npm install` | yes |
| the WordPress plugin | plugin update | no |

An engine release can fix the thing you reported, a word that could not be
edited or a panel showing the wrong value, while `git diff` on this package
shows nothing at all. That is not a release that forgot your bug. It is a fix
that was never going to live here.

**To see which engine you are on**, with the publishable key already in your
page:

```
curl -s -H "Authorization: Bearer <publishable key>" \
  https://live.tryshipfast.com/api/live-edit/v1/<site>/plugin
```

If that number has moved since you last looked, the fix you are waiting for may
already be live. Reload the page rather than reinstalling anything.

## Why a package, when there is already an HTTP API

In React the DOM is a projection of state, not the source of it. An edit written
straight into the page is undone by the next render and lost entirely on a
client-side navigation, both measured on a real Next app before this was
written. No API call fixes that, because it is not a transport problem.

So the value becomes React state. Then an edit re-renders like any other change:
it survives re-renders, survives routing, and needs no fight with the reconciler.

## Licence and support

Proprietary. The source is published so you can read and audit what runs inside
your application. Running it requires a current ShipFast licence. Terms are in
[LICENSE](./LICENSE).

Questions, or something behaving differently to what is written here:
[tryshipfast.com](https://tryshipfast.com).
