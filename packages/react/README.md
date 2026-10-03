# @shipfasts/live-edit-react

In-place editing of **static** content in React and Next.js apps — the words and
assets that live in the template, not data from your API or database. Dynamic
content stays yours.

Part of [ShipFast Live Edit](https://tryshipfast.com). The same editor serves
Laravel, WordPress and plain HTML; this is the React and Next.js adapter.

## Install

```bash
npm install @shipfasts/live-edit-react
```

React 18 or 19, Node 18 or newer. The package is ESM with no build step, so
what you read in `src/` is exactly what your bundler sees.

You also need a site key, issued in your ShipFast console. The key licenses the
site; the people who edit sign in at the console, so nobody needs an account on
your application and you store no passwords for this.

## Why a package, when there is already an HTTP API

In React the DOM is a projection of state, not the source of it. An edit written
straight into the page is undone by the next render and lost entirely on a
client-side navigation — both measured on a real Next app before this was
written. No API call fixes that, because it is not a transport problem.

So the value becomes React state. Then an edit re-renders like any other change:
it survives re-renders, survives routing, and needs no fight with the reconciler.

## Use

```jsx
import { LiveEditProvider, useContent } from '@shipfasts/live-edit-react';

export default function App({ children }) {
  return (
    <LiveEditProvider
      site="acme"
      apiBase="https://cms.example.com/api/live-edit/v1"
      publishableKey={process.env.NEXT_PUBLIC_KB_KEY}
    >
      {children}
    </LiveEditProvider>
  );
}

function Hero() {
  return <h1 data-edit="setting:auto:1a2b3c">{useContent('auto:1a2b3c', 'Original words')}</h1>;
}
```

The second argument is the words already in the component. That matters more
than it looks: the component still renders its own copy with no provider, no
network and no content at all. Adding this cannot leave a page blank, and
removing it later leaves working code behind.

## The props

`site` and `apiBase` are required. Everything else has a default that is right
for most applications.

`publishableKey` is optional, and the types say so. It is what the provider
reads content with, so leaving it out is only sensible when you pass `content`
yourself from the server — which, on a Next App Router app, you probably do.
Without either, the provider has nothing to show but your template's own copy,
which is the correct outcome and not an error.

This section used to open by calling it required, while the types marked it
optional. The types were right.

**`content`** is the client's words, fetched on your server so they are already
in the HTML that arrives. Leave it out and the provider fetches them itself on
mount: the page paints your template's original copy, then repaints with the
client's. Behind a login nobody minds. On a public page they will, because the
repaint is visible and a crawler that does not run JavaScript indexes the
template instead of the client's site. Pass it wherever you can render on the
server, which in practice means Next.js.

```jsx
// app/layout.jsx, a server component
import { readContent } from '@shipfasts/live-edit-react/server';

return <LiveEditProvider site={site} apiBase={apiBase} publishableKey={key} content={await readContent()}>…
```

**`sessionKey`** you almost certainly do not need. Somebody signing in is
handed their session in a URL fragment, and a browser never sends a fragment to
a server, so a server component cannot know it and a prop threaded down from
one is always empty. The provider finds the session itself and waits to be told
when the runtime has one. Pass this only if your own server mints sessions, as
below, and already knows who is at the keyboard.

## Server components

Most of an App Router page is server components, and they cannot call hooks. So
the words they render come from `/server` instead, a separate entry point:

```jsx
import { LiveEditText, liveEditWords } from '@shipfasts/live-edit-react/server';

// As a component, wherever the words are - including inside a .map().
<p data-edit="setting:auto:1a2b3c">
  <LiveEditText contentKey="auto:1a2b3c" fallback="Original words" />
</p>

// Or as a lookup, if you would rather read them yourself.
const words = await liveEditWords();
<h1>{words('auto:1a2b3c', 'Original words')}</h1>
```

Configure it with three environment variables, read on the server only:

```
LIVE_EDIT_SITE=acme
LIVE_EDIT_API_BASE=https://cms.example.com/api/live-edit/v1
LIVE_EDIT_KEY=your-key
```

`live-edit-codemod` writes this shape for you in any file it can see is
server-rendered, and the client shape everywhere else. It works that out from
the whole project rather than from one file's first line: a component with no
`'use client'` of its own still renders in the browser if something client
imports it.

**A separate entry point, deliberately.** This one holds your key, and an
import that cannot appear in a client bundle cannot leak one into a client
bundle. Do not import `/server` from a component marked `'use client'`.

**It never throws.** No configuration, a timeout, an error, a login page where
JSON was expected: every one of them renders the words already written in your
component. Editing your content must never be able to take your site down.

**Edits appear on the next render**, not as you type - there is no React in the
browser holding that component's state. Rows of a list are keyed individually,
so three cards built from one piece of markup hold three sets of words; adding,
removing and reordering rows need a client component, and the codemod tells you
which lists those are rather than passing over them quietly.

## Minting a session

Your server decides who may edit, because your users are not ours.

### Which key is which

The prefix tells you, and it is the only thing that does:

| prefix | what it is | where it may go |
| --- | --- | --- |
| `kbp_` | publishable | the browser. Everything it can read is already public. |
| `kbs_` | secret | your server only. It can mint sessions and publish. |
| `kbe_` | session | minted by your server, short-lived, held by one person's browser. |

A `kbp_` key is the one that belongs in `NEXT_PUBLIC_…`. A `kbs_` key never
is, and the name of that variable is the test: if a bundler would inline it,
it is the wrong key.

This used to say a secret key is "refused if you try" to use one in a browser.
That was not accurate and is worth correcting plainly, because somebody
deciding whether the key in their hand is the safe one deserves better than
reassurance. What the service actually enforces is the origin allowlist and
what each key is allowed to do — not where it was sent from. A secret key used
from an allowed origin would work, which is exactly why it must not be there.
Keeping it off the page is a rule you hold, not one held for you.

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

The page receives a short-lived, write-scoped key. Scraped out of the page, it
expires on its own, and it cannot mint another.

## Saving

Edits show immediately and save after a pause — one request per key per pause,
not one per keystroke. A failed save leaves the typed words on screen rather
than reverting, because silently restoring the old text is how somebody loses a
paragraph without being told.

## Making an existing app editable

You do not hand-edit components. The codemod walks the project and does it:

```bash
npx live-edit-codemod .          # shows what it would do, changes nothing
npx live-edit-codemod . --write  # applies it
```

It reads `.js`, `.jsx`, `.mjs`, `.ts` and `.tsx` — JSX lives in `.js` as often
as in `.jsx`, so the extension is not taken as a guide to the contents. `.ts` is
parsed without JSX, because there `<T>value` is a type assertion and reading it
as a tag turns working code into a parse error.

What it changes, and what it will not touch:

| | |
|---|---|
| `<h1>Northfield Studio</h1>` | tagged, and read from content |
| `<p>Hello {user.name}</p>` | left alone — built from your data |
| `<Button>Save</Button>` | left alone — text is a prop, not a DOM node |
| already tagged | left alone, so a second run cannot orphan saved edits |

Positions are edited in the original source rather than reprinting from the
syntax tree, so the diff contains only what changed. A file that cannot be
parsed is reported and skipped, never guessed at.

A client component gets the hook and edits appear instantly. A server component
gets the marker only — it renders once, on the server, so there is no React on
the client to re-render it and its edits land on the next render.

Measured on two real templates: 88% of text-bearing elements on a marketing
landing page, 80% on a blog starter. What is left out is genuinely dynamic —
a sentence built from a constant in code — plus form labels carrying a
decorative asterisk in a nested span.

### Lists, when the card is in its own file

The ordinary shape of an App Router page: `posts.map(post => <PostPreview/>)`
in one file, the words in another. The codemod wires both sides, because
neither file can see the other.

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
component used once on its own page is ordinary content, and used inside a list
is per-row, decided where it is rendered rather than where it is written. A
client component needs none of this: the identity travels in React context, and
`LiveEditItem` puts it there.

Identity comes from the item's own data, never the React key, which is
routinely an array index and is not promised to survive a refetch.

The row travels as far as the chain goes. A card that renders another component
from a third file hands it on, because being inside something drawn per row is
what makes a thing per row.

One thing is reported rather than wired, so it does not read as coverage: a card
the scan cannot resolve to a file it is about to rewrite - from a package, or
behind an import it cannot follow.

Most App Router projects are almost entirely server components, so by default
very little is live. `--client` makes the files it touches into client
components — the directive is added along with the hook, since a hook without
it is not a working component — and then every edit appears in place.

```bash
npx live-edit-codemod components --write --client
```

## The editor itself

The provider decides how an edit reaches React. It does not put the editor on
the page, and it cannot: the overlay is fetched from the service on every page
view so that improving it reaches every site at once, rather than freezing at
whatever version somebody installed.

So add one tag, the same one every other adapter uses. In `index.html` for a
Vite app, or the root layout's `<head>` in Next:

```html
<script src="https://cms.example.com/s/acme.js" defer></script>
```

That is what creates `window.liveEditApi`, draws the toolbar, and signs people
in. Without it the provider still renders the client's published words and
nothing else happens: no toolbar, no sign-in, nothing to click.

It is also where `sessionKey` comes from, which is why you almost never pass
that prop. Somebody signing in is handed their session in a URL fragment, the
runtime stores it and announces it, and the provider is listening.

After a save the editor asks the provider whether anything is actually reading
that key. A client component is, so the words change in place and the page is
not reloaded: scroll position, open menus and whatever the visitor was doing
stay as they were. An element inside a server component is not, so the page is
fetched again instead. Pass `onRefresh={() => router.refresh()}` in Next and
that happens without a full navigation.

## The shape a Next App Router install actually takes

Two files, because one cannot work. The docs say to fetch content on the
server and to pass `onRefresh={() => router.refresh()}`, and both are right —
but `await readContent()` needs a server component and `useRouter` needs
`'use client'`, so they cannot be the same file. Every App Router install
therefore writes this wrapper, and it was left for each of them to work out.

The layout stays a server component and fetches the words, so they are in the
HTML that arrives:

```jsx
// app/layout.tsx  — server component
import { readContent } from '@shipfasts/live-edit-react/server';
import LiveEditProviderWrapper from './live-edit-provider';

export default async function RootLayout({ children }) {
  const content = await readContent();

  return (
    <html lang="en">
      <body>
        <LiveEditProviderWrapper
          site={process.env.NEXT_PUBLIC_LIVE_EDIT_SITE}
          apiBase={process.env.NEXT_PUBLIC_LIVE_EDIT_API_BASE}
          publishableKey={process.env.NEXT_PUBLIC_LIVE_EDIT_KEY}
          content={content}
        >
          {children}
        </LiveEditProviderWrapper>
        <script src="https://live.tryshipfast.com/s/your-site.js" defer />
      </body>
    </html>
  );
}
```

The wrapper is the client half, and exists only to hold the hook:

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

In Next, `next/script` with `strategy="afterInteractive"` is the usual way to
add that tag; see the note below about what that costs on a development
server.

## Getting in, the first time

Load the site and you will see nothing. That is correct, and it is the single
most confusing thing about installing this, so it is written down here rather
than left to be worked out: a visitor gets the published words and no editor.
There is no toolbar to look for and nothing to click.

To edit, arrive through the door:

```
https://your-site.test/?kb-enter=1
```

That sends you to the console to sign in and returns you to the page you were
on with a session, and the toolbar appears. Two things have to be true: the
address is one the site's origins allow, and your account is allowed to edit
that site in the console.

A whole install checked over an afternoon turned out to be working the entire
time — every module loaded, eleven hundred elements tagged, not one error
anywhere — and looked like a failure only because nobody had opened that door.

### It can be slow in development, and that is not it failing

In a Next app this is usually mounted with `strategy="afterInteractive"`, which
means the tag is injected only once React has hydrated. On a development server
hydration is slow, so the page can sit for the better part of ten seconds
before anything is tagged — measured at 8.5s on a real app, which is long
enough for anybody to conclude it is broken and start changing things.

Before changing anything, build it: `npm run build && npm start`. Hydration is
far quicker and the wait usually disappears. If it does not, move the tag to
`strategy="beforeInteractive"` in the root layout.

The console tells you which it is. The runtime says what it is waiting for when
it is running on a local address, so check there before unpicking the wiring.

### A published edit, and the HTML a crawler sees

Worth reading once, because the failure it describes reports nothing anywhere.

If a page renders statically, `readContent()` runs at **build time** and its
answer is baked into the HTML. Publish an edit afterwards and the server HTML
does not move. Measured on a Next 16 install:

```
publish -> rebuild with a warm .next -> still the old words
publish -> rm -rf .next && rebuild   -> the new ones
```

An incremental build does not pick content up. Content is not a source file, so
nothing marks the prerender stale — and a host that keeps `.next` between
deploys (the default for the Next plugin on Netlify, among others) can serve
the old copy indefinitely.

Visitors are mostly spared. The overlay applies published content after
hydration, so a person sees current copy, with a repaint. **Crawlers and first
paint do not get that**, and they are who marketing copy is written for.

So this package asks the service to be considered stale after a minute:

```js
// what readContent() sends, unless you say otherwise
{ next: { revalidate: 60 } }
```

In the App Router a route's revalidation period is the lowest of its fetches',
so this gives every page that reads content incremental regeneration **without
a line added to any of them** — which matters when a codemod has just made
twenty-seven routes editable and the twenty-eighth would have been forgotten.
Static rendering is kept and the HTML is at most a minute behind.

To choose differently:

```js
await readContent({ revalidate: 300 });   // five minutes
await readContent({ revalidate: false }); // never stored; renders per request
await readContent({ cache: 'force-cache' });
```

`revalidate: false` puts a fetch back on the request path. That is a supported
choice, not a trap — every call this package makes carries a timeout, and
`readContent()` never rejects: a content service that is slow, down, or not set
up yet leaves the words already written in your components on the page.

## Which half a fix lands in, and why this package rarely moves

Worth knowing before reading a diff and concluding nothing was done, which has
happened twice.

This package is an adapter. It wires a React app to the service and it never
carries the runtime - there is a test in the engine whose whole job is to fail
if it ever starts to. So the two halves move at completely different rates:

| what changed | how it reaches you | shows in this package? |
| --- | --- | --- |
| the scanner, both appliers, the editor panel, the preview | served by the service, automatically | **no** |
| this package: provider, hooks, types, codemod | `npm install` | yes |
| the WordPress plugin | plugin update | no |

So an engine release can fix the thing you reported - a word that could not be
edited, a heading that lost its spacing, a panel that showed the wrong value -
while `git diff` on this package shows nothing at all. That is not a release
that forgot your bug. It is a fix that was never going to live here.

**To see which engine you are on**, from anywhere, with the publishable key
that is already in your page:

```
curl -s -H "Authorization: Bearer <your publishable key>" \
  https://live.tryshipfast.com/api/live-edit/v1/<your site>/plugin
```

It answers with the version the service is running. If that number has moved
since you last looked, the fix you are waiting for may already be live - reload
the page rather than reinstalling anything.

## Licence and support

Proprietary. The source is published so you can read and audit what runs inside
your application; running it requires a current ShipFast licence. Terms are in
[LICENSE](./LICENSE).

Questions, or something behaving differently to what is written here:
[tryshipfast.com](https://tryshipfast.com).
