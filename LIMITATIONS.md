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

---

## Fixed

Kept because a fault that happened once can happen again.

| What | Adapter | Fixed in |
| --- | --- | --- |
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

**React and Next.js:** everything. Detection is not the question — whether an
edit survives a re-render, a route change and hydration is.

---

## One-off, unexplained

Recorded rather than chased, so that a second sighting is recognised as a
pattern rather than treated as new.

- **2026-09-27** — a single `503` from `/content` on a local static site, never
  reproduced across repeated requests. Local dev server under concurrent load
  is the likely cause; no server-side error was logged.
