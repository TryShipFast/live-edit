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

### The React package is not published anywhere a customer can install from
**Adapter:** React, Next.js. **Found:** 2026-09-27. **Updated:** 2026-09-27.

The console tells a customer to run `npm install @shipfast/live-edit-react`.
That package does not exist on npm: the registry still returns 404, and the
repo it lives in is private, so `npm install` from git is not open to them
either. The instruction cannot be followed by anybody outside this machine.

The package itself is now ready to go, and was proved from a consumer's side
rather than assumed. A packed tarball was installed into a throwaway project
and, from there: `import { LiveEditProvider, useContent }` resolves, the
provider server-renders both the fallback words and supplied content,
`npx live-edit-codemod src --write` tags a component, `--client` writes the
hook and an import of this package by name, and `--help` explains itself. It
type-checks clean under `@types/react` 18 and 19. The tarball carries twelve
files: `bin/`, `src/`, README and LICENCE, and nothing else.

Three faults were found in the process, all of which would have met the first
customer rather than us. `publishConfig.access` was unset, so the `@shipfast`
scope would have published restricted and no customer could install it.
`license`, `repository`, `homepage`, `engines` and `files` were all absent,
and the LICENCE was not in the tarball at all. The type declarations named
`JSX.Element`, a namespace `@types/react` 19 removed, so every TypeScript Next
app, which is most of them, failed to compile with an error pointing inside
`node_modules`. All three are fixed.

**The single step that remains:** somebody with the npm account runs
`npm publish` from `packages/react`. The exact sequence, including the org and
2FA prerequisites and what to check afterwards, is in
`packages/react/PUBLISHING.md`. Nobody owns the `@shipfast` scope on npm yet,
so creating the org is part of that same sitting. Until it is done, the
Next.js and React install cards should not claim otherwise.

### A new list item arrives carrying the first item's words
**Adapter:** all. **Found:** 2026-09-27. **Severity:** low.

"+ Add another" on the second card of a nine-card grid inserted a new card
holding the **first** card's title and paragraph, not the words of the card it
was added from and not an empty one. The new item is correct in every other
way — its own id, the right position, a complete copy of the design — so this
is about which words it starts with.

Defensible as "the first item is the template", but somebody adding a card
beside the one they are working on will expect either that card's shape or a
blank one, and will now have two cards saying the same thing until they notice.

**To close it:** copy the item the person was on, or start the new one empty
with the design intact. Worth a decision rather than a guess.

### A sentence changed in two places at once loses its arrangement
**Adapter:** all. **Found:** 2026-09-27. **Severity:** low.

Editing words on both sides of a bold phrase in one go leaves nothing to say
which side of the phrase the new words belong on, so the runs of text collapse
into one and the phrase ends up trailing the sentence. No words are lost, and
a single change — which is what an edit almost always is — keeps everything in
place.

**To close it:** align each run separately rather than placing one contiguous
change, if this ever turns out to bother anybody. It may not be worth it.

---

### WordPress will not accept an SVG, where the service will
**Adapter:** WordPress. **Recorded:** 2026-09-27. **Severity:** low.

Pictures now go into the client's own media library, which means uploads pass
WordPress's file-type check rather than ours. WordPress refuses SVG, so an SVG
logo that uploads fine on every other adapter is refused here with WordPress's
own wording: "Sorry, you are not allowed to upload this file type." Measured.

Not fixed, deliberately. The service accepts SVG because it sanitises the file
and serves it from a different origin; WordPress serves the library from the
client's own domain, where a gap in any sanitiser is stored XSS on their site.
Core refuses SVG for that reason, and overriding it from this plugin would
change a security property of somebody's site without their ever being asked.

**What a client should do instead:** upload a PNG, or install one of the SVG
plugins if they accept the trade — the route uses WordPress's own check, so the
moment their site allows SVG, this does too.

**To close it:** nothing to close on our side. It is the host's decision.

---

### Style drafts held on the service before this release are not carried down
**Adapter:** WordPress. **Recorded:** 2026-09-27. **Severity:** low.

When WordPress took ownership of its words, publishing moved to the site while
styling was still written to the service. Anything held unpublished there was
stranded: it could be saved, and seen while editing, and could never go live.
Three such drafts were found on the test site.

Published styling is brought down on upgrade. Held styling is not, because it
was never visible to anybody but its author and could not be published at all.
A client who had a colour waiting will find it gone and will have to set it
again - and this time it will publish.

**To close it:** nothing to close. Carrying down work that could never have
been released would restore a state the product never had.

---

### A lapsed licence takes a static site's published words off the page
**Adapter:** plain HTML. **Recorded:** 2026-09-27. **Severity:** high, and it
is a commercial decision rather than only a bug.

Measured as a clean before and after on the video template, changing nothing
but the key. With the key good, a visitor with no cookies reads the sentence
the client published. With the site's publishable key revoked, the same
visitor reads the template's original sentence instead. Every word that client
ever published is gone from their live website, and their site does not say
why.

The site itself stays up: the template renders, all nine images load, there is
no editor and no error visible to a reader. The mechanism is that a static
page is tagged and filled in the browser, and both the tagging call and the
content endpoint refuse an unauthenticated read, so the page falls back to
whatever the HTML on disk says.

Laravel and WordPress do not have this exposure. They keep their content in
their own database and render it themselves, so a lapsed licence there costs
them the editor and leaves their words alone. Plain HTML is the adapter where
the service holds the content, which is the deliberate shape of the
framework-agnostic product.

**The decision, which is the owner's and not a developer's:** stopping the
service when somebody stops paying is reasonable. Quietly reverting the text
of somebody's live website to the template it was bought from is a different
thing, and it happens without warning, to a site whose owner may not connect
it to a lapsed subscription for days.

**Options if the answer is that it should not happen:** publish a snapshot the
page can read without a key, so published content survives a lapse while
editing stops; or have the CLI bake published content into the HTML at publish
time, so the files on disk are already correct; or leave it and say so plainly
in the terms, at the point of sale.

---

### Anything inside a .map() is not editable, which on a real page is most of it
**Adapter:** React, Next.js. **Recorded:** 2026-09-27. **Severity:** high for
React, because it decides how much of a page a customer can actually change.

The codemod tags a JSX element whose only child is a plain string. That rule
is deliberate and right: a sentence built from an expression is data from the
host's own database, and tagging it would attach a key to something that
changes on every render. But it means a list rendered from an array is
untouched, and on the template measured here the catalogue cards, the
categories, the paging, the quick links and the testimonials are all arrays.

Counted on that app: 62 elements tagged, and most of the words a visitor
actually reads are not among them. The README's claim of around 80% of
text-bearing elements does not hold on a page like this, and site navigation
is untouched as well because router links are components rather than DOM.

Laravel and WordPress do not have this problem: their lists are tagged in the
rendered HTML, where a repeated item is just more markup, and list editing is
measured working on two adapters.

**To close it:** the list support that already exists for the other adapters
needs a React equivalent, keyed on the data rather than on the element, so a
customer can edit the items and not only the headings above them. That is a
piece of work rather than a patch, and it is the honest reason the React
column should not be sold as finished just because its critical path is green.

---

### Fixed: a generated picture could be paid for and never kept
**Adapter:** all. **Recorded and fixed:** 2026-09-28.

Generating a picture charged five credits, showed the client their picture,
repainted the page when they clicked it, and then refused to save it.

The model configured here, gpt-image-1, returns base64 and never a url. The
editor turned that into a two megabyte `data:` URI and put it straight into
the value to be saved. Both endpoints that receive such a value refuse it, on
two independent grounds: a `data:` URI is not an http address, and two
megabytes is not a two thousand character field. Measured both ways.

Every test passed throughout. Each one stubbed the provider with a response
carrying a `url`, so the suite proved the bookkeeping - charged once, refunded
when nothing arrives, key never leaving the server - against a response shape
the provider does not send.

**Fixed on the server rather than in the browser.** The bytes are stored and
an address is handed back, which is what the rest of the pipeline has always
expected. Four generated pictures would otherwise be eight megabytes of base64
shipped to a browser, held in memory and uploaded again, and fixing it here
fixes it for every adapter at once. Bytes that cannot be decoded are treated
as nothing usable, which refunds. A provider that does send a url is left
alone.

Measured after the fix against the real provider: 38s, five credits, a 1.4MB
1024x1024 PNG stored, a 96 character address, and both endpoints that used to
refuse it now accept it.

**The lesson worth keeping:** a stub is written from what we expect the other
side to send. When it is also the only test, it tests our expectation rather
than their behaviour.

---

### A free photograph used as a background credits nobody
**Adapter:** all. **Recorded:** 2026-09-28. **Severity:** high, because it is a
licence obligation rather than a defect.

Replacing a picture stores the photographer beside it: the address, the alt
text and four fields of credit, all as settings, and the attributions endpoint
can list them. Using the same photograph as a section background stores the
address and nothing else.

Measured on the real thing. A photograph was chosen through the picker, the
use was reported to Unsplash correctly, and afterwards the style row held one
field, `backgroundImage`. No credit setting existed, the attributions endpoint
listed zero, and the photographer's name appeared nowhere in the site's data.
The only place it was ever shown was a toast at the moment of choosing, which
is gone as soon as it fades.

The editor says this out loud on purpose - the code notes that a background
has no element of its own to carry a credit - but telling somebody once, in a
message that disappears, is not the same as them having discharged the
obligation. The photograph stays on the page for years.

It matters more for Openverse than for Unsplash. Unsplash asks for
attribution; a Creative Commons licence requires it, and Openverse is what a
customer with no API key gets by default. So the default path produces the
strongest obligation and the least credit.

**To close it, one of:** store the credit fields with the style the way they
are stored beside a picture, so the data at least exists and the attributions
endpoint can see it; render a small credits line for a page that uses any
attributed photograph; or refuse to offer attribution-required photographs as
backgrounds at all. The first is cheap and makes the other two possible. What
is not defensible is the current state, where the obligation exists and the
information needed to meet it was never kept.
**Adapter:** React, Next.js. **Recorded:** 2026-09-27.

This register carried an entry saying a client-rendered tree reverted
DOM-level edits, and that the codemod's classification was the cause. Measured
after the key-stability fix, it is not: an edit to a genuine server component
survives save, publish, a full reload, and is seen by a visitor with no
session. The reverting was the codemod writing a different key on a second run
— which is in the Fixed table above — and the classification was a theory
built on top of the symptom.

Kept as a correction rather than deleted, because the reasoning was wrong in a
way worth recognising: a plausible mechanism was written down as though it had
been observed. The classification fix was still worth making on its own terms,
and is listed above.

---

### A fitted picture is not the one the media library would pick
**Adapter:** WordPress. **Recorded:** 2026-09-27. **Severity:** low.

A replacement is cropped to the box it was dropped into, and the page is given
that copy. The library holds the untouched original and WordPress's own
generated sizes, so anybody using the picture elsewhere gets a sensible file -
but the cropped copy is ours, not a size WordPress manages, and it carries no
`srcset`: a phone downloads the same file a laptop does.

Kept out of the attachment's size metadata on purpose, because a thumbnail
regeneration rebuilds that list from registered sizes and would have deleted a
file the page points at. Measured: after a full regeneration the picture is
still there, and deleting the picture still removes it.

**To close it:** generate a small set of widths per box rather than one, and
write a `srcset` the page can use. Worth doing when picture-heavy sites show up.

---

## One-off, unexplained

Recorded rather than chased, so that a second sighting is recognised as a
pattern rather than treated as new.

- **2026-09-27** — a single `503` from `/content` on a local static site, never
  reproduced across repeated requests. Local dev server under concurrent load
  is the likely cause; no server-side error was logged.
- **2026-09-27** — the Next.js test template throws "Application error: a
  client-side exception" when the browser goes back to a page it has already
  rendered. Reproduced on the **pristine** template with no live-edit present,
  so it is the template's own fault or a Next 16 dev-mode quirk. Recorded
  because it makes the back-navigation row unmeasurable on this app, and
  another template will be needed to measure it.
