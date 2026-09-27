# Known limitations

Every limitation found while testing an adapter is either fixed or written
down here. Nothing is allowed to stay only in somebody's head or in a chat
log, because the ones that get forgotten are the ones a customer finds.

Each entry says what happens, who it affects, and what it would take to close
it. A fixed entry keeps its history: knowing a fault existed is how the next
person recognises it coming back.

Found by driving real, content-rich websites through the whole journey —
detect, edit, save, reload, navigate, publish, then look again as a visitor.
Toy pages agree with whatever the code already does.

---

## Open

### Editing a node with mixed content can move its siblings
**Adapter:** all. **Found:** 2026-09-27, Laravel (learnkasts course page).

An eyebrow label was a coloured status dot followed by text, both inside one
element. Editing it through the drawer replaced the whole container's text, so
the dot ended up on the wrong side of the words, and a second, empty change
appeared in the publish list for the dot's own node.

The selection is landing on the container when it should land on the text node
inside it. Somebody editing a sentence should not be able to move a decoration
they never touched, and an empty change they did not make should not turn up in
the list of things they are about to publish.

**To close it:** select the text node rather than its parent when a container
mixes text with inline elements, and leave sibling elements untouched. Worth
doing before design protection, since it is the same question — what exactly
did the person mean to change.

### The Laravel entry route returns to the application's own destination
**Adapter:** Laravel. **Found:** 2026-09-27.

`/live-edit/enter` sent the editor to `/admin` rather than to a page where
editing happens, because the host application redirects an authenticated user
there. Harmless — the editor works once you navigate to a public page — but it
lands somebody in a dashboard when they asked to edit a website.

**To close it:** carry the page they came from through the sign-in round trip,
the way the static adapter and the WordPress plugin already do with
`?kb-enter=1`, and return them to that page rather than to the host's default.

### WordPress does not own its content, though the architecture says it does
**Adapter:** WordPress. **Found:** 2026-09-27.

The stated architecture is that Laravel and WordPress both keep their own data
and ask the service only whether the licence is good. Laravel does: after an
edit, the application's own settings table held the row and the control plane
held none.

WordPress does not. Counted after editing and publishing: 12 content rows in
the control plane, and nothing in `wp_options`, `wp_posts` or `wp_postmeta`
except transients — the licence answer, the editor session, and cached pages.
The plugin has no code path that writes content into WordPress at all.

It works, and it may even be the right design. But it is not what the
architecture claims, and the difference is the answer to the question a
customer will eventually ask: what happens to my words if we fall out. On
Laravel the words are already theirs. On WordPress they are not.

**To close it:** either write edits into WordPress as the architecture
describes, or change the architecture to say what is true and make the
consequence explicit in the console — that a WordPress site's content lives
with us, exactly as a plain HTML site's does.

### The React package is not published anywhere a customer can install from
**Adapter:** React, Next.js. **Found:** 2026-09-27.

The console tells a customer to run `npm install @shipfast/live-edit-react`.
That package does not exist on npm — the registry returns 404 — and the repo
it lives in is private, so `npm install` from git is not open to them either.
The instruction cannot be followed by anybody outside this machine.

It packs cleanly (11 files, 12.1 kB) and declares its dependencies, so there
is nothing wrong with the package itself. It has simply never been sent
anywhere, and publishing is a decision with a name, a scope and an owner
attached to it rather than something to do quietly.

**To close it:** either publish to npm under an owned `@shipfast` scope, or
serve a tarball from the control plane the way the WordPress plugin's zip is
already served, and print whichever is true in the install card. Until one of
them is done, the Next.js and React instructions should not claim otherwise.

### A client-rendered tree reverts DOM-level edits
**Adapter:** React, Next.js. **Found:** 2026-09-27.

The codemod decides a file is a server component when it has no
`"use client"` of its own. That is not what makes a component server-side: a
file imported by a client component is client-rendered whatever its own
directive says. The template tested has `"use client"` on its root layout, so
every component in it is client-rendered, and the codemod classified twelve of
fifteen files as server.

For the ones it calls server it writes the marker and no hook, on the
reasoning that there is no React on the client to undo the edit. Where that
reasoning is wrong the edit is applied to the DOM and then reverted by the
next render — which the provider triggers itself when it finishes fetching
content.

Running the codemod with `--client` avoids it, but nothing tells anybody to.

**To close it:** classify by the import graph rather than by the file's own
directive, or treat a client root layout as making the whole tree client-side.
Until then `--client` is the answer for App Router projects and should be what
the console prints.

### The codemod cannot change its mind
**Adapter:** React, Next.js. **Found:** 2026-09-27.

Re-running with `--client` over already-tagged files reports "0 elements in 0
files" and does nothing. The skip is deliberate — a second run must not
re-key a client's existing edits — but it means somebody who runs the plain
version, finds their edits reverting, and reaches for `--client` gets a
success message and no change.

**To close it:** say what was skipped and why, and offer to add hooks to
elements that already carry a marker without changing their keys.

### React has no way to learn about the editing session
**Adapter:** React, Next.js. **Found:** 2026-09-27.

The provider takes `sessionKey` as a prop, and the README shows it arriving
from the server. It cannot: the session is handed back in a URL fragment,
which browsers never send to a server. Measured on the running app — the
runtime had the session (`liveEditApi.token` set, body marked, 142 elements
tagged) while the provider reported `editable: false`.

The consequence is that edits go into the DOM rather than through React, which
is the arrangement the provider exists to avoid.

**To close it:** let the provider fall back to the session the runtime already
found, in an effect so it cannot affect hydration, and have the runtime
announce it. Keep the prop for applications that genuinely have a server-side
session.

---

## Fixed

Kept because a fault that happened once can happen again.

| What | Adapter | Fixed in |
| --- | --- | --- |
| The same element got a different key depending on which directory the codemod was pointed at, silently orphaning every edit already made | React, Next.js | unreleased |
| One JSX expression in the package meant Next.js rendered nothing at all — no build error, no console error, every page blank | React, Next.js | unreleased |
| The runtime wrote `data-admin`, `data-edit` and `data-kb-bg` before React hydrated, which is enough for React to distrust the tree | React, Next.js | unreleased |
| The npm package was named after something this product is not called | React, Next.js | unreleased |
| A page the server marked editable got no editor unless its layout had `@liveEdit`, so an app with several layouts half-worked in silence | Laravel | v0.8.4 |
| A folder of HTML files had no way to start editing at all; the session arrives in a fragment and nothing put one there | Plain HTML | v0.8.3 |
| Registration discarded the port, so a site on `:8110` was checked on port 443 and reported unreachable | all | v0.8.3 |
| The well-known file check accepted any response containing the code, so a soft-404 serving the home page "verified by file" | all | v0.8.3 |
| A migration dropped an index MySQL still needed for a foreign key, then its own half-finished work blocked the retry | all | v0.8.2 |
| A server asking on its own behalf sends no Origin, and that silence was read as "wrong domain" — switching the editor off on correctly licensed sites | WordPress, Laravel | v0.8.1 |
| The unknown-address path at sign-in hashed against a malformed bcrypt string and threw, so a mistyped address got a 500 that announced the address was unknown | all | v0.8.1 |
| One person needed one account per site, so an agency had a login per client | all | v0.8.0 |
| A WordPress owner could not prove they owned their domain without FTP or a child theme | WordPress | v0.7.0 |
| Every platform's install instructions were shown at once, so a customer had to work out which was theirs | all | v0.7.0 |
| A CSRF timeout on the sign-in page answered `419 PAGE EXPIRED` — a developer's sentence on the one page every client meets | all | v0.8.2 |

---

## Not yet measured

Not limitations. Rows nobody has run, listed so they are not mistaken for
passing. A tick is only written here after it has been driven in a browser.

**Every adapter:** lists and repeated components, tables, forms, SVG and icons,
background images, CSS-generated content, rich text (bold, italic, links),
alt text and SEO fields, responsive behaviour after an edit, page-load
overhead.

**Laravel:** Blade components and nested components, Eloquent-backed
collections, conditional content, `@foreach` output.

**WordPress:** Gutenberg blocks, template parts, custom fields, featured
images, menus, WooCommerce content, behaviour alongside other plugins.

**Plain HTML:** relative URLs across subdirectories, multi-page asset paths.

**React and Next.js:** images, lists and mapped elements, nested components,
client-side state, `next/image`, dynamic routes, static generation, and
whether an edit survives a client-side route change. Detection is measured and
good — 86 elements across 15 files, 142 in the DOM once the runtime has run.
What is not yet proven is persistence through a re-render, which the first two
open items above are about.

---

## One-off, unexplained

Recorded rather than chased, so that a second sighting is recognised as a
pattern rather than treated as new.

- **2026-09-27** — a single `503` from `/content` on a local static site, never
  reproduced across repeated requests. Local dev server under concurrent load
  is the likely cause; no server-side error was logged.
