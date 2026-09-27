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
| Detect | ✓ 278 | ✓ | ✓ | ✓ 62 | ✓ 142 |
| Edit | ✓ | ✓ | ✓ | ✓ | ✓ |
| Save | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reload | ✓ | ✓ | ✓ | ✓ | ✓ |
| Navigate | ✓ | ✓ | ✓ | ✓ | ✓ |
| Re-render | — | — | — | ✓ | ✓ |
| Publish | ✓ | ✓ | ✓ | ✓ | ✓ |
| Visitor sees it | ✓ | ✓ | ✓ | ✓ | ✓ |

React now has a measured column of its own. A Vite app, React 19 in
StrictMode, react-router, and the same video template the plain-HTML column
was measured on, rebuilt as components: 208 elements rendered, 62 tagged
across four routes, 23 on the home page. Edited through the drawer, saved,
survived a client navigation away and back, survived a full reload, published,
and seen by a visitor holding nothing. Nothing in the served HTML carries a
marker: every one of them appears after mount, which is the structural
difference from the App Router column and the reason it was worth running
separately.

Two things were found by running it. The codemod was writing the raw source
text as the fallback, so the template's `&gt;` paging arrow rendered as four
literal characters on the page: fixed, with the fallback now folded and
decoded the way JSX itself would have done it, and the key still hashed from
the raw text so nobody's saved edits move. And a blank page that looked
damning turned out to be the test app's own `useEffect(() => window.scrollTo(0, 0))`,
whose return value React took for a cleanup function. Worth recording because
the first guess was our provider and it was not.

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

Styling is theirs now too, in `wp_kastsbuild_styles`, and closing that gap
turned out to fix a live fault rather than only a principle. Since the words
moved, a style saved on WordPress went to the service as a draft while
publishing happened here - so a client could change a colour, watch it apply
while editing, press Publish, and no visitor would ever see it. Three such
drafts were sitting stranded on this site. Measured end to end: a colour set in
the drawer posted to the site's own route, listed in Changes as "text colour",
published, and served to a visitor holding no cookies as
`[data-style="..."]{color:#c2410c !important;}` - with the service holding 0
style rows throughout.

History carries it: restoring a version taken before the colour removed it, and
restoring the snapshot that restore created put it back. Reverting a style
leaves a held word alone, and "use default" publishes as removal rather than as
a row that stays.

**This half needs a package release to take effect.** The plugin sends styling
with the page; a service running 0.9 ignores it and falls back to its own
table, which is the old behaviour rather than a broken one. Sites upgrade
safely in either order.

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
| A revoked key ends a session already open | ? | ? | ✓ | ? |
| A revoked site key leaves the site standing | ? | ? | ✓ | ? |

The WordPress row that reads ✓ for "no host account at all" was proven the
hard way: every WordPress session was deleted server-side first, so the
browser's cookie was worthless, and the person edited and published anyway.

Revocation was measured on the static site, which is the adapter where the
service owns everything and so has the most to say when a key stops working.
With an editor open and mid-edit, the key was revoked server-side. The next
save was refused, the editor told the person their session had ended and
offered a new link, it forgot the stored session, and the page went back to
how a visitor sees it. Nothing hung and nothing pretended to save.

Revoking the site's own key leaves the website standing: the template renders,
all nine images load, and there is no editor. What it does not leave standing
is the client's published words, which is the entry now in LIMITATIONS.md.
Those two rows are ticked for plain HTML only. Laravel and WordPress keep
their own content and would behave differently by construction, which is worth
measuring rather than reasoning about.

## What this says

Three adapters have an honest critical path. None has a complete matrix, and
the gap between those two statements is the point of this file.

The most useful next measurements, in order: lists and repeated components
(the biggest untested block, and the one customers will hit first), images,
then Next.js re-render and client navigation once the codemod classification
is fixed.
