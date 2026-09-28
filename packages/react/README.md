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

export default function Layout({ children, content, sessionKey }) {
  return (
    <LiveEditProvider
      site="acme"
      apiBase="https://cms.example.com/api/live-edit/v1"
      publishableKey={process.env.NEXT_PUBLIC_KB_KEY}
      sessionKey={sessionKey}   // absent for visitors; present only for editors
      content={content}         // fetched on the server, so there is no flash
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

Most App Router projects are almost entirely server components, so by default
very little is live. `--client` makes the files it touches into client
components — the directive is added along with the hook, since a hook without
it is not a working component — and then every edit appears in place.

```bash
npx live-edit-codemod components --write --client
```

## The editor itself

The overlay is the same one every adapter uses. On a page this application does
not serve, tell it where to save:

```html
<script>
  window.liveEditApi = { base: 'https://cms.example.com/api/live-edit/v1', site: 'acme', token: sessionKey };
</script>
```

It then posts to the content API with the session key instead of to same-origin
routes with a session cookie. Text and links work that way today; images and
collections do not yet have API endpoints, and the editor says so by name
rather than posting to a URL that does not exist and reporting success.

After a save it asks the provider whether anything is actually reading that
key. A client component is, so the words change in place and the page is not
reloaded — scroll position, open menus and whatever the visitor was doing stay
as they were. An element inside a server component is not, so the page is
fetched again instead. Pass `onRefresh={() => router.refresh()}` in Next and
that happens without a full navigation.

## Licence and support

Proprietary. The source is published so you can read and audit what runs inside
your application; running it requires a current ShipFast licence. Terms are in
[LICENSE](./LICENSE).

Questions, or something behaving differently to what is written here:
[tryshipfast.com](https://tryshipfast.com).
