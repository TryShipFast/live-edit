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

## The two optional props

Three are required: `site`, `apiBase` and `publishableKey`. The others have
defaults that are right for most applications, and one of them used to appear
in this example in a way that implied it was needed. It is not.

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

Never put a secret key in a browser — it is refused if you try. Your server
decides who may edit, because your users are not ours:

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

## Licence and support

Proprietary. The source is published so you can read and audit what runs inside
your application; running it requires a current ShipFast licence. Terms are in
[LICENSE](./LICENSE).

Questions, or something behaving differently to what is written here:
[tryshipfast.com](https://tryshipfast.com).
