# @kastsbuild/react

In-place editing of **static** content in React and Next.js apps — the words and
assets that live in the template, not data from your API or database. Dynamic
content stays yours.

## Why a package, when there is already an HTTP API

In React the DOM is a projection of state, not the source of it. An edit written
straight into the page is undone by the next render and lost entirely on a
client-side navigation — both measured on a real Next app before this was
written. No API call fixes that, because it is not a transport problem.

So the value becomes React state. Then an edit re-renders like any other change:
it survives re-renders, survives routing, and needs no fight with the reconciler.

## Use

```jsx
import { LiveEditProvider, useContent } from '@kastsbuild/react';

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
