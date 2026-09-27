# Adapter acceptance matrix

What each adapter has actually been driven through, in a browser, on a real
content-rich site. A tick here means somebody watched it work end to end, not
that the code looks right.

Legend: **✓** measured working · **✗** measured broken, see LIMITATIONS.md ·
**?** never run · **—** does not apply

Sites used: Laravel on a real application (learnkasts, several layouts,
Livewire and Filament present) · WordPress on Astra + Elementor ·
Plain HTML on a downloaded four-page video template ·
Next.js 16 on a downloaded App Router marketing template.

---

## The critical path

Detect → edit → save → reload → navigate → publish → confirm as a visitor.

| | Laravel | WordPress | Plain HTML | React | Next.js |
| --- | --- | --- | --- | --- | --- |
| Detect | ✓ 278 | ✓ | ✓ | ? | ✓ 142 |
| Edit | ✓ | ✓ | ✓ | ? | ✓ |
| Save | ✓ | ✓ | ✓ | ? | ✓ |
| Reload | ✓ | ✓ | ✓ | ? | ✓ |
| Navigate | ✓ | ✓ | ✓ | ? | ✓ |
| Re-render | — | — | — | ? | ✓ |
| Publish | ✓ | ✓ | ✓ | ? | ✓ |
| Visitor sees it | ✓ | ✓ | ✓ | ? | ✓ |

React has its own column because nothing has been run against a plain React
app — Vite or Create React App. Everything in the Next.js column was measured
on App Router, and the two differ in exactly the way that matters here.

## Who owns the content

Measured by counting rows, not by reading the design.

| Adapter | Owns the content | Evidence |
| --- | --- | --- |
| Laravel | **the application** | 1 row in the app's own settings table, 0 in the control plane |
| WordPress | **WordPress** | words in `wp_kastsbuild_content`, snapshots in `wp_kastsbuild_versions`, pictures in the site's own media library; the plane's count stayed frozen at 12 and it received 0 bytes of media |
| Plain HTML | the control plane | as intended, the site has no data layer of its own |
| Next.js | the control plane | 1 published row in the plane |

**WordPress now matches the stated architecture.** It keeps its client's words
in tables of its own — `wp_kastsbuild_content` for published and held changes,
`wp_kastsbuild_versions` for snapshots — so `wp db export` contains their
content rather than an opaque reference to ours. The page is still sent to the
service to be marked up, and the words go with it to be applied, but the
service stores none of them: measured across an edit and a publish, its row
count for that site did not move.

The twelve rows it already held were copied down and left in place, frozen.
Nothing writes to them again. A migration that goes wrong is survivable, at
the cost of a second copy that will drift.

History is local too, which is the part that would otherwise have quietly
rebuilt the dependency. Measured: restoring version 1 put twelve values back,
the page returned to what it had said before, the restore itself was kept as
version 2 so it can be undone, and the plane never moved.

Pictures are the client's as well. An upload becomes a real attachment in their
media library, so it appears in the grid, in the block editor, in `wp db export`
and in whatever backup they run. Measured twice: once at the HTTP level, and once
by clicking through the editor's own drawer in a browser. A 1800x1200 photograph
chosen in the drawer produced a library row holding the untouched original and a
472x552 copy cropped to the 236x276 box the design had; the page pointed at the
client's own domain; a visitor with no cookies saw it; and the service recorded
zero bytes of upload. The photographer's credit on the picture that was replaced
was cleared in the same request, so no name was left under somebody else's
photograph.

**What is still not the client's: styles.** Corner rounding, spacing and the
rest still go to `/live-edit/style` on the service, because the plugin does not
claim that route. Nothing has been written there for this site yet - measured, 0
rows - so nothing is lost today, but a client who changes a corner radius puts
that row in our database rather than theirs. It is the same fix as the words:
claim the route, keep a table. That is the next stage rather than a limitation,
and it is called out here so the ownership claim above stays honest.

## Content types

| | Laravel | WordPress | Plain HTML | React | Next.js |
| --- | --- | --- | --- | --- | --- |
| Headings and paragraphs | ✓ | ✓ | ✓ | ? | ✓ |
| Buttons and labels | ? | ? | ? | ? | ? |
| Links (text and href) | ? | ? | ? | ? | ✓ |
| Nested / mixed content | ✓ | ✓ | ✓ | ? | ✓ |
| Images | ? | ✓ | ? | ? | ? |
| Background images | ? | ? | ? | ? | ? |
| Lists and repeated items | ? | ✓ detect | ✓ | ? | ✓ |
| Tables | ? | ? | ? | ? | ? |
| Forms | ? | ? | ? | ? | ? |
| SVG and icons | ? | ? | ? | ? | ? |
| Rich text (bold, italic) | ? | ? | ? | ? | ? |
| Alt text | ? | ✓ | ? | ? | ? |
| SEO fields (title, description) | ? | ? | ? | ? | ? |

WordPress was re-run on the current runtime and detects 107 elements, 37
lists and 8 images on an Astra and Elementor site. Its image drawer offers
replace, alt text, title attribute and remove; alt text was set through the
editor and survived a reload, which is the first SEO-adjacent field measured
anywhere. Image **replacement** is now ✓ there, clicked through in a browser: Edit site,
click the picture, choose a file, type alt text, Save changes, Publish. The
browser's only POST about that picture went to the site's own route; a visitor
holding no cookies then saw the new photograph and the new alt text. This is the
first adapter where replacing a picture has been watched end to end. Its
lists are still marked "detect" because detection was measured and the edit
itself was not.

Lists were measured on two adapters. A nine-card grid on the static site and a
three-plan pricing table in Next.js: editing one item leaves the others
untouched, "+ Add another" inserts a complete new item with its own id next to
the one you were on, "Delete this item" removes only that one, and all three
survive a reload. On Next.js that includes surviving React's own render. Both
still need running on Laravel and WordPress before those cells move.

Nested / mixed content was measured on five shapes — a decoration before the
words, an icon before them, a badge after them, an inline phrase between them,
and a wrapper holding them. The fix is in the shared editor and in the server's
applier, with both halves compared against each other, so it is ticked
everywhere the editor runs. React is a question mark only because nothing has
been run against a plain React app at all.

## Platform-specific rows

| Laravel | | | WordPress | |
| --- | --- | --- | --- | --- |
| Blade text | ✓ | | Theme text | ✓ |
| Several layouts | ✓ | | Post/page title | ? |
| Blade components | ? | | Gutenberg blocks | ? |
| Eloquent-backed content | ? | | Template parts | ? |
| `@foreach` output | ? | | Custom fields | ? |
| Conditional content | ? | | Featured images | ? |
| Livewire / Filament pages | ? | | Menus | ? |
| Application behaviour unchanged | ✓ | | WooCommerce | ? |
| | | | Other plugins unaffected | ? |

| Plain HTML | | | Next.js | |
| --- | --- | --- | --- | --- |
| Multiple pages | ✓ | | Server components | ✓ |
| Static assets | ✓ | | Client components | ? |
| Relative URLs | ? | | SSR | ✓ |
| CSS-generated content | ? | | Static generation | ? |
| Responsive after an edit | ? | | `next/image` | ? |
| | | | Dynamic routes | ? |
| | | | Hydration | ✓ |
| | | | Client navigation | ✓ forward |

Server components are ✓: an edit to one survives save, publish, a full reload,
and is seen by a visitor holding no session. That was measured only after the
codemod stopped writing a different key on a second run — the earlier reverting
was the key moving, not the rendering.

Client navigation is ticked forward only. Going **back** throws a client-side
exception in this template, reproduced with no live-edit present at all, so
that row needs a different app before it can be judged.

## Authentication and permissions

| | Laravel | WordPress | Plain HTML | Next.js |
| --- | --- | --- | --- | --- |
| Sign in through the control plane | ✓ | ✓ | ✓ | ✓ |
| `?kb-enter=1` from any page | ✓ | ✓ | ✓ | ✓ |
| Works with no host account at all | ? | ✓ | — | ✓ |
| Host's own login still honoured | ✓ | ✓ | — | — |
| One login across several sites | ✓ | ✓ | ✓ | ✓ |
| Publish permission per site | ✓ | ✓ | ✓ | ✓ |
| Removing an editor ends their session | ✓ | ✓ | ✓ | ✓ |

The WordPress row that reads ✓ for "no host account at all" was proven the
hard way: every WordPress session was deleted server-side first, so the
browser's cookie was worthless, and the person edited and published anyway.

## What this says

Three adapters have an honest critical path. None has a complete matrix, and
the gap between those two statements is the point of this file.

The most useful next measurements, in order: lists and repeated components
(the biggest untested block, and the one customers will hit first), images,
then Next.js re-render and client navigation once the codemod classification
is fixed.
