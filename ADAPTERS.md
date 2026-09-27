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
| WordPress | **the control plane** | 12 content rows in the plane; WordPress holds only transients (licence, session, page cache) |
| Plain HTML | the control plane | as intended, the site has no data layer of its own |
| Next.js | the control plane | 1 published row in the plane |

**WordPress does not match the stated architecture.** The intention on record
is that Laravel and WordPress both keep their own data and only ask us whether
the licence is good. Laravel does. WordPress does not: the plugin never writes
content into `wp_options`, `wp_posts` or `wp_postmeta`, and an edit goes to
the plane like any cloud site. That is a deliberate-looking design — the
plugin reads content and caches it — but it is not what the architecture says,
and it changes the answer to "what happens to my words if we fall out".

## Content types

| | Laravel | WordPress | Plain HTML | React | Next.js |
| --- | --- | --- | --- | --- | --- |
| Headings and paragraphs | ✓ | ✓ | ✓ | ? | ✓ |
| Buttons and labels | ? | ? | ? | ? | ? |
| Links (text and href) | ? | ? | ? | ? | ✓ |
| Nested / mixed content | ✓ | ✓ | ✓ | ? | ✓ |
| Images | ? | ✓ detect | ? | ? | ? |
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
anywhere. Its lists and image replacement are marked "detect" rather than ✓
because detection was measured and the edit itself was not.

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
