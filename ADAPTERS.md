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
| AI rewrite and shorten | ✓ service | ✓ service | ✓ service | ✓ service | ✓ service |
| AI generated picture | ✓ service | ✓ service | ✓ service | ✓ service | ✓ service |
| Stock photo picker | ? | ? | ✓ | ? | ? |
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

The AI rows read "service" because they were driven against the real provider
rather than through each adapter's drawer. The call is the same one from every
adapter, so proving it once proves the hard part; what is not yet measured is
the click.

Measured against OpenAI, not a stub. Rewrite returned a sensible sentence in
3.2s for one credit, shorten in 1.7s for one, and a refusal with no credits
came back as a typed reason rather than an exception. A picture took 38s and
five credits and arrived as a real 1024x1024 photograph with no lettering in
it, which is what the prompt framing exists to force.

The stock photo picker is ✓ on plain HTML, clicked through: Free photos,
searched, twelve real photographs with the photographer named under each, one
chosen, the use reported back to Unsplash as their terms require, saved as a
219 character address and painted for a visitor holding no cookies. Both
providers were driven directly as well: Unsplash in 1.5s with a key, and
Openverse in 1.8s with no key at all, which is the claim that a customer who
never signs up for anything still gets free photographs.

What that run also found is in LIMITATIONS.md: a photograph used as a
background is stored with no photographer's name anywhere.

Running it for real is also what found the fault described in LIMITATIONS.md:
every one of these tests stubbed a response carrying a `url`, and the model
they are pointed at only ever sends base64. Stub-shaped tests proved the
bookkeeping perfectly and could not see that the feature did not work.

## Text a framework is already writing

Not tagged, on any adapter. An element carrying `x-text`, `v-text`, `ng-bind`
or their html variants has an author who has said out loud that something else
writes there, and tagging it means the editor and the framework overwriting
each other on every render.

Found on our own pricing page, which is the right place to find it. Alpine
wrote the yearly figure when somebody pressed Yearly and the editor wrote the
published words straight back: the toggle flipped, the numbers did not move,
and nothing reported an error. Measured after the fix: zero of those elements
tagged, and all four prices switch between monthly and yearly.

React needed a whole adapter for this problem. Alpine and Vue needed a list of
four attribute names.

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

---

## Readiness, as of 2026-09-29

Not every adapter is equally finished, and saying so is cheaper than a
customer finding out on their own site.

| Adapter | Position |
| --- | --- |
| Laravel | Production. The whole journey driven on a real application. |
| WordPress | Production, with WordPress owning its own content and media. |
| Plain HTML | Production. The licence question that qualified this is fixed: an expired licence key still reads, so a lapse costs the editor and not the published words. |
| React | **Preview.** Repeated data is not editable. |
| Next.js | **Preview**, for the same reason — React list support is the prerequisite. |

`Platform::isPreview()` marks the last two, and the platform picker says so at
the moment somebody chooses, which is the only moment it is cheap to know.

**Preview belongs to one of the two routes, and only one.** The product is
sold two ways, and the framework question exists in just the first:

| Route | Who | Framework |
| --- | --- | --- |
| Connect your existing site | developer or agency | Laravel, WordPress, Next.js, React, static HTML |
| Buy a template | the site owner | none of their business |

So a React limitation reaches a developer who chose React deliberately, on
the route where a build step is a normal Tuesday. It cannot reach somebody
who bought a template, connected a domain and started typing: that person
never learns what their site is built with, which is the point of that route.

Worth stating because "React: Preview" read on its own sounds like an
apology to customers. It is a note to integrators, and the number of people
it can surprise is bounded by the route they took.

## The React repeated-content milestone

Scoped deliberately narrowly, because the first framing of it was much too
wide. Repeated-data identity, persistence, ordering, add and remove, and
versioning are **not** React work. They exist in the shared protocol and are
proven on two adapters:

```html
<ul data-edit-list="courses">          <!-- the collection -->
  <li data-edit-item="course_101">     <!-- stable item identity -->
    <h2 data-edit="...">Title</h2>     <!-- editable field -->
```

with the order stored as content, so reordering and adding survive a publish
like anything else.

The React adapter's job is to speak that existing protocol for mapped data.
Three problems, and only three:

**1. Identity.** `data-edit-item` must come from the item's own data id.
**Not the React `key`**: keys are routinely the array index, are often
absent, and are never guaranteed stable across a refetch, so keying content on
one silently reassigns somebody's edits to the wrong item when the data
reorders. Where the data has no stable id, the adapter needs a fallback the
customer can see rather than an unstable identity it invents quietly.

**2. Surviving re-render.** React destroys and recreates DOM. The editing
attributes have to come back with it, reusing what the provider already does
for ordinary text rather than growing a second mechanism beside it.

**3. Write-back.** The DOM is not the source of truth here, which is the real
architectural difference from every other adapter. An edit has to reach the
host application's own state so React renders the new value.

### Which tool does which part

Worth naming, because a session told only to "make .map() editable" can
reasonably build all of it in the wrong place.

- **`src/codemod.js`** emits the scaffolding. It reads source, so it is the
  only thing that can see a `.map()` at all. A `data-edit-list` on the
  container and a `data-edit-item` on the rendered item come from here.
- **`src/provider.js`** keeps it alive across re-render and client
  navigation, reusing what it already does for ordinary text.
- **`src/bridge.js`** carries an edit back into the host's state.

**Do not relax the codemod's single-text-child rule to do it.** It is
load-bearing:

```js
if (children.length !== 1 || children[0].type !== 'JSXText') return;
```

That is what stops a key being attached to a sentence built from data, which
would attach it to something that changes on every render. The list work adds
a second rule beside it for a different shape. Reaching for this one and
loosening it is the plausible wrong turn, and it produces a worse bug than the
one being fixed.

### Found while building: the existing text mechanism cannot be reused as-is

The scope above says problem 2 should reuse "what the provider already does
for ordinary text rather than growing a second mechanism beside it". That
instruction cannot be followed literally, and the reason is worth recording
before somebody tries.

The codemod rewrites words to an inline hook call:

```jsx
<h1>{useContent("auto:abc", "Northfield Studio")}</h1>
```

Correct for one element rendered once. Illegal inside a `.map()`. React
matches hook calls to slots **by the order they happen**, so the number of
calls a component makes has to be the same on every render. One call per row
means a list that gains or loses a row shifts every later hook onto the wrong
slot. Not a lint preference: it is the reason the Rules of Hooks exist, and
the corruption is silent and arbitrary.

So repeated content reads through a **component**, `<LiveEditText>`, rather
than a hook call. Each row rendered from a `.map()` is its own component
instance with its own slots, so one hook call inside it is one call however
many rows there are. It renders no element of its own - it returns the string -
because a wrapper would change the CSS of every list item on every site using
it.

This is a second mechanism, which the scope warned against, and it is the
right one. The thing not to duplicate is the *content* path: `<LiveEditText>`
is a wrapper over the same `useContent`, reading the same provider state, with
the same fallback behaviour. Only the call shape differs, because only the
call shape has to.

**Its prop is `contentKey`, and cannot be `key`.** React takes `key` for
itself: it is read off the element and never reaches the component, so a value
passed that way arrives as `undefined` and every row renders its fallback
forever - which looks exactly like content that failed to load.

### Identity, settled

`itemIdentity()` reads the item's own data, in this order: `id`, `uuid`,
`uid`, `_id`, `ref`, `sku`, `slug`. A slug is last of the real ones because it
is stable in practice and editable in principle, where a primary key cannot be
rewritten by anybody.

Three refusals, each of which is a way real data goes wrong:

- **A field that is not an identity**, even when the name fits. An `id`
  holding an object stringifies to `[object Object]` for every row: one
  identity, shared by the whole list.
- **A list of plain strings.** Tempting, because the string is usually unique.
  Wrong, because the string is the very thing the client is about to edit, so
  the first edit changes the identity and orphans itself. An identity derived
  from content is not an identity.
- **A list where only some rows have ids, or two share one.** Asked of the
  array rather than each item, because the answer has to be one thing: a list
  with holes is not partly editable, it is one whose identities collide as
  soon as the data changes.

`listIdentity()` returns the reason in words that can be shown to whoever
installed it, which is the "fallback the customer can see" the scope asks for.

Content keys are `<list>.<field>@<itemId>`, the same `@` suffix the shared
protocol now uses for a copied item's hand-written keys. One convention for
"this key, but for that item", arrived at from two directions.

### What the codemod emits, and what it still refuses

Detection is narrow on purpose. A `.map()` counts when its callback parameter
is a plain identifier and it returns a host element - directly or through a
`return`. A destructured parameter is refused: the fields are there but the
item as a whole is not, and the item is what identity comes from. A callback
returning a component is refused too, because its children are props rather
than DOM and whatever it renders is tagged where it is written.

```jsx
<ul data-edit-list="list4b49a53d46">
  {courses.map((course) => (
    <li data-edit-item={itemIdentity(course)} key={course.id}>
      <h3 data-edit={editMarkerFor("list4b49a53d46", "title", course)}>
        <LiveEditText contentKey={contentKeyFor("list4b49a53d46", "title", course)}
                      fallback={course.title} />
      </h3>
```

Note what is *not* there: `data-edit-item={course.id}`. The key prop is in the
source and is ignored, every time.

**The whole key is composed in the attribute**, rather than the overlay
assembling one from an ancestor. That is what lets React lists work with an
unchanged editor: the overlay goes on knowing only about DOM nodes and keys,
which is the property that lets one editor serve every adapter.

Two shapes are tagged inside an item, and the second was not in the original
scope:

- **A field of the item**, `{course.title}`. One level of property only; a
  nested path invites two different fields to flatten into one name.
- **Words written into the card**, `<span>Free</span>`. Keyed per item rather
  than once for the list, because a client is looking at one card - editing
  the badge on the third course and watching all nine change is not a saving
  anybody asked for. Without this a card has its title editable and the word
  beside it not, which is exactly the half-finished feeling the milestone
  exists to remove.

**A list with nothing editable inside it is not marked at all.** The
scaffolding exists to hang fields off, so marking a collection the editor can
offer nothing for is an attribute nobody reads - the same lesson as the mapper
writing regions no consumer wanted, caught this time before it shipped.

**The single-text-child rule was not relaxed**, which the scope names as the
plausible wrong turn. `<p>Hello {user.name}</p>` outside a list is still
untouched. The new rule sits beside it and is safe for the reason the old one
is not: inside a list the key carries the item's identity, so it does not mean
something different on every render.

### Problems 2 and 3, as they turned out

**Write-back needed no bridge change whatsoever.** A list field's key is an
ordinary flat string, `list4b49….title@101`, so `set()` and `apply()` carry it
like any other. The bridge still has exactly five members and knows nothing
about lists. That is the return on composing the whole key in the attribute,
and it is the property to protect: the day the overlay needs a special case
for React lists, this design has gone wrong.

`set()` still answers whether a hook was listening, and for a list field the
answer is yes, because `<LiveEditText>` registers like anything else. A key
for a row that is not on the page answers no, exactly as a server-rendered
element does, so the editor fetches the page again rather than believing an
edit landed.

**Re-render was smaller than the scope feared.** The codemod writes the
markers into the JSX, so React emits them on every render and a re-mount
brings them back with everything else. The provider needs no mechanism to
restore them. Pinned by a test anyway, because it is true until somebody moves
an attribute out of the component.

### What is proven, and what is only simulated

Worth separating, because the difference is where the next fault will be.

**Proven by test:** an edit lands on its own row and no other; the editor is
told the key was handled; a row that is not on the page reports as unhandled;
identities survive the list being re-derived from scratch **in a different
order with a new row among them**, which is the failure an identity taken from
position or from the React key produces; markers come back after a re-mount.

**Not proven:** a real client-side navigation. The test unmounts and mounts
again with content supplied, which is the right shape for the risk the scope
names - re-derivation and reordering - and is still not a Next.js router
moving between routes and fetching the content for a new page. That step needs
a running app, and the scope is right that it is the one most likely to be
skipped.

**Not built yet:** add, remove and reorder. These need the developer's own
array to pass through the adapter before `.map()` runs - something like
`useLiveEditList(key, courses).map(...)`, a hook called once per component
rather than once per row, so the Rules of Hooks are not in question. The
settled rule that a new item copies the one it was added from has a natural
shape here: clone the source item's object and give it the new id, so
`itemIdentity()` finds the new identity and every field falls back to the
copied values.

### Measured on a real app, then fixed

Run against `kb-next-real`, the Next.js blog starter, on 2026-09-29. The list
work found **nothing**. Zero `data-edit-list`, on an app whose front page is a
list of posts.

```jsx
// more-stories.tsx - the list
{posts.map((post) => (
  <PostPreview key={post.slug} title={post.title} excerpt={post.excerpt} … />
))}

// post-preview.tsx - the card, in another file
<h3><Link href={`/posts/${slug}`}>{title}</Link></h3>
<p className="…">{excerpt}</p>
```

Both refusals are correct and both are load-bearing. The map returns a
**component**, whose children are props rather than DOM. The card's words are
**expressions**, which is the rule that stops a key being attached to
something that changes every render. Neither should be relaxed.

And the result is that on the app most like a real customer's, list support
does nothing at all. The toy JSX in the tests agreed with the code, and the
real template found the limitation in one run - which is exactly what testing
on rich sites is for.

**What the milestone actually has to cover**, then, is two elements in two
files with a component boundary between them, because that is how React is
written. `<article>` with the words inline, which is what the tests use and
what the codemod handles today, is the shape of an example rather than the
shape of an app.

**The sketch, not yet built.** Identity has to cross the component boundary at
runtime, since no build-time tool can know that `PostPreview` is only ever
rendered inside a list:

- The mapped child is wrapped in a `<LiveEditItem id={itemIdentity(post)}>`
  that provides context and renders no DOM of its own.
- Inside the card, `useContent` composes its key with the identity from that
  context when there is one, so the same component is per-item inside a list
  and ordinary outside it.
- Words that arrive as props are the unresolved part. `{title}` inside the
  card is an expression, and the reason for refusing an expression genuinely
  does weaken inside an item - the key carries the identity - but the codemod
  cannot tell from `post-preview.tsx` alone that it will ever be in one.

**Built, and measured again on the same app: 11 elements tagged and the list
found.** None of the three options in that sketch turned out to be needed.

The identity is neither passed as a prop nor inferred across files. It is put
into context around the row and picked up at render:

```jsx
{useLiveEditList("list1dd…", posts).map((post) => (
  <LiveEditItem id={itemIdentity(post)}>
    <PostPreview … />      // another file, knows nothing about lists
```

`useContent` composes that identity onto its key when there is one. So the
same `PostPreview` is per-row inside a list and ordinary on its own page - one
component, two correct behaviours, decided where it is rendered rather than
where it is written. `LiveEditItem` renders no DOM: a wrapper between a grid
and its children would break the layout of every site that installed this.

**The expression rule was narrowed, not relaxed.** An element whose whole
content is one value - `<h3>{title}</h3>` - is now tagged. A sentence *built*
from data - `<p>Hello {user.name}, welcome back</p>` - is still refused, and
so is anything computed: a call, a ternary, a template, a deep path. The
original reason survives intact, because it was only ever about half a
sentence belonging to the host and a key meaning something different every
render. One value being read is neither.

**One fault this introduced, caught by a test rather than by thinking.** A
`.map()` that cannot be keyed - a destructured parameter gives the fields but
not the item - was refused as a list, and its contents were then tagged by the
ordinary rules with **one key for every row**. Editing the first card would
have changed all of them, silently. The refusal had been accidental rather
than intended, which is not the same thing and did not survive the next
change. A region nobody can key is now claimed and left entirely alone:
nothing editable is better than everything linked together.

**Still not covered, and now known to be harder than it looks:** words inside
a component the card itself renders, such as
`<h3><Link href={…}>{title}</Link></h3>` in the blog starter. `Link` is a
component, so its children are props and there is no host element to mark.

The obvious fix is to tag the `<h3>` and let the runtime read and write
through it. Writing already works - the applier recurses into a single
childless element rather than guessing. **Reading cannot be made to work from
the DOM alone**, and the case that proves it is ordinary rather than exotic:

```html
<p><strong>street it stands on</strong></p>
```

That is a wrapper whose words live in its child. It is *also* exactly what a
sentence looks like after a client clears it, leaving only the phrase that was
bold. Read through, and cleared words reappear in the editor and are written
back on the next save. Tried on 2026-09-29 and reverted within the hour; a
test caught it immediately.

Both shapes have one element child and whitespace-only text of their own, so
nothing in the markup separates them. Any fix has to be **told** rather than
deduced - an attribute written by whatever tagged the element, with both
halves landing in the same change. Not built, because adding an attribute for
one narrow shape before its reader exists is the exact habit that produced the
mapper's unread regions.

Worth recording separately: reading and writing therefore disagree for a pure
wrapper, including the plain `<a data-edit><span>Book</span></a>` case that
has nothing to do with React. Long-standing, narrow, and not worth trading a
correct clear for.

### Measured again, further in: the list never engages on App Router

Run properly this time - the package installed into `kb-next-real`, the
codemod run over `src/` as a developer would, the output read. Two things,
and the second changes the milestone's scope rather than adding to it.

**A destructive bug, found and fixed.** The one-value rule tagged
`{children}`. `<div className="min-h-screen">{children}</div>` in the app's
own layout was marked as editable text, which means anything stored against
that key replaces the entire page body with a string. Every test for that rule
used `{title}`, and `{children}` is identical to a parser. It is refused now,
by name, along with `props.children`.

**And the scope finding.** After that fix the codemod reports:

```
11 elements in 7 files
  0 client-side (editable live), 7 server-rendered (edits land on refresh)
```

One file in seven carries `'use client'`. `more-stories.tsx` - the list -
is a server component, so `tagList()` claimed its subtree and returned without
writing anything: no `useLiveEditList`, no `LiveEditItem`, no item keys.

That is correct as written, and it is the problem. `useLiveEditList` and
`useContent` are hooks, and a server component cannot call one. **So on an App
Router app, where server components are the default and most of the page,
everything built for repeated content is inert.** The inline-card shape the
tests use is not merely the shape of an example rather than an app, as
recorded above - it is the shape of a *client* component, which is rarer still.

**Three ways out, and the choice is a product decision rather than a detail:**

- **Convert the component.** `--client` already does this. It moves rendering
  to the browser, which is a real change to somebody's app made on our
  account, and on a content site it gives up the thing App Router is for.
- **Apply content on the server.** A server component can await content and
  render it directly, no hooks involved - which is what `RemoteContent`
  already does for other adapters and has no caller for. Editing then lands
  on refresh, which is exactly what the codemod already promises for server
  files. Identity still has to reach the markup, but `itemIdentity(post)` is
  a plain function call and works anywhere.
- **Leave server lists alone and say so.** Honest, and it means the milestone
  covers the smaller half of a typical App Router page.

The second is the one that matches how Next is actually written, and it is
also the one that needs the least from the customer: no directive moved, no
component converted, no rendering strategy changed.

**Not built.** Recorded because picking wrong here is the expensive mistake,
and because the previous entry's conclusion - that the component boundary was
the last hard part - was measured on too little of the app.

### Test the whole journey, not the part that is easy to reach

The acceptance steps for this work are the project's own:

> detect → edit → save → reload → **navigate** → publish → confirm as a visitor

plus add, remove and reorder. **Navigate is the one that will be skipped and
the one most likely to fail.** A client-side navigation re-mounts the component
and re-runs the `.map()`, so every identity is derived again from nothing. A
fallback keyed on position would silently reassign somebody's edits there, and
a re-render test cannot catch it because the data has not changed.

Publishing and then looking as a visitor matters for the same reason from the
other side: a visitor's render has no provider and no editor in it.

### Decided, so the React session does not have to

**A new item copies the one it was added from.** Settled on 2026-09-29 as a
rule for every adapter, and already true of Laravel, WordPress and plain HTML.
React inherits it rather than choosing again.

It needed no protocol: the editor inserts a new id immediately after the item
whose button was pressed, so the order already records where it came from.
Whatever React does for identity, it should keep that property — the order is
the record of provenance, not just of sequence.
