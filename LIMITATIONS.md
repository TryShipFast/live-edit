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

### Fixed: the mapper wrote labels and regions that nothing read
**Adapter:** all. **Found:** 2026-09-29. **Fixed:** 2026-09-29.

**Fixed, and the original finding was wrong on its facts.** Both outputs are
read. The grep that produced this entry searched for the attribute spelling,
`data-edit-label`, and the runtime reads it through the DOM property,
`dataset.editLabel`, so every real consumer was invisible to it. Labels name
the element in the panel chip and the panel subtitle; regions are read in two
places, one of which names the band an element sits in.

What was actually wrong was narrower and worth fixing. The region is written
only by the AI pass, and that pass did not ask the model about `header`, `nav`
or `footer` - it stamped the tag's own name back as the region, on the sound
reasoning that HTML already says what those bands are and a guess could only
make it worse. But having settled "do not ask", it then answered anyway. So a
`<header>` carried the region "Header", which is the word the editor derives
from the tag regardless, and a `<nav>` carried "Navigation" where the panel's
own vocabulary says "Menu" - the friendlier word, and the whole point of the
function that picks it.

The model is only ever consulted about ambiguous `<section>`s, and a
`<section>` has no tag-name answer, so the one case where a region carries
real information already worked.

Two changes, both small:

- The AI pass no longer writes a region for a band HTML already names.
  Settled now means do not ask **and** do not answer. A region means a name
  somebody worked out.
- Because that is what it means, a region now outranks the tag name in
  `describeElement()` rather than losing to it. The two consumers disagreed
  about this before, and the one that got it right said so in a comment.

**Worth keeping from the original entry**, because the reasoning stands even
though the premise did not: writing an attribute nothing consumes looks like a
feature to whoever reads the code next. That is the cost, and it is paid in
the wrong currency - not by a customer, by the next person.

**Also worth keeping:** no fixture anywhere carried a `data-edit-region`,
which is why the mismatch survived. The pass has its own switch
(`LIVE_EDIT_MAPPER_AI`), is off by default and needs `--ai` on the command
line as well, so none of this ever ran on a customer's site.

### Fixed: the React package could not be installed by a customer
**Adapter:** React, Next.js. **Found:** 2026-09-27. **Fixed:** 2026-09-29.

**Fixed.** `@shipfasts/live-edit-react` is on npm, the scope exists, and
0.11.0 is the `latest` tag, so the console's install instruction can be
followed. Verified from a customer's side rather than assumed: a fresh
`npm install` into an empty project links `node_modules/.bin/live-edit-codemod`
and `npx live-edit-codemod --help` runs.

**Worth knowing for the next publish**, because an hour went to it: this
machine has two npms. The shell default is npm 10 on Node 21 and holds no
token; the authenticated one is npm 11 on Node 22, under Herd. Publishing
with the wrong one fails as `404 Not Found - PUT ... is not in this
registry`, which reads as the package not existing rather than as not being
logged in. `bin/publish-react` picks the right npm, prints who it thinks you
are before sending anything, and refuses with the login command if you are
nobody.

The original entry, for the history it records:

The console told a customer to run `npm install @shipfasts/live-edit-react`.
That package did not exist on npm: the registry returned 404, and the repo it
lives in is private, so `npm install` from git was not open to them either.
The instruction could not be followed by anybody outside this machine.

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

### Fixed: a new list item arrived carrying the first item's words
**Adapter:** all. **Found:** 2026-09-27. **Fixed:** 2026-09-29.

**Fixed.** A new item now copies the one it was added from. Decided as a rule
for every adapter rather than per adapter, so Laravel, WordPress, plain HTML
and whatever React grows all behave the same, and the React list work does not
have to settle it a second time.

No protocol was needed. The editor already inserts a new id immediately after
the item whose button was pressed, so the order says where it came from; the
scanner walks back to the nearest known item. Two items added in a row leave
an id with no element yet, which is why it walks rather than taking the entry
immediately before: copying the wrong thing is bad, copying nothing is worse.
An item added at the very top still falls back to the first, because in that
case there is nothing else to copy.

The original finding follows.

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

### Fixed: a copied list item shared its keys when the keys were written by hand
**Adapter:** Laravel and any site tagged with semantic keys.
**Found:** 2026-09-29. **Fixed:** 2026-09-29.

**Fixed.** Adding an item copies one, and the copy now gets its own keys
whether the original's were written by the scanner or by a developer. Editing
the new card can no longer rewrite the card it came from.

An auto key is a hash of where the element sits, measured from the item's own
id, so giving the copy its id and re-hashing was all the separation that case
ever needed. A hand-written key has no such structure to re-derive from, and
was left exactly as it was: the copy carried `courses.two.title` like its
original, and the two cards shared one value.

Leaving it alone had a real reason, which is why this was recorded as a design
decision rather than patched at the time. The key means something to the
config the developer declared it in, and inventing an unrelated one would
leave that declaration pointing at nothing.

**The rule: suffix, do not replace.** `courses.two.title@n1a2b3` is a
different key, so the cards hold separate content, and the declaration it came
from is still legible in it - by eye, and to anything that cares to look,
because the base is everything before the `@`.

Three things made it smaller than it looked:

- **Nothing has to fall back to the base to read it.** An added item is a copy
  of the markup, so it arrives already carrying the words it was copied from.
  A stored value only needs to exist once somebody edits the copy, and by then
  it is that copy's own.
- **`@` is safe where `:` would not have been.** Keys are split on `:` to
  separate a locale from the rest, and a key carrying one would have read as a
  language nobody declared. That trap is already recorded in the code: taking
  any prefix once read the scanner's own `auto:` keys as a language called
  "auto" and dropped every one of them.
- **Nothing validates content keys against a declared list.** Checked rather
  than assumed: saving a setting accepts any string, in the engine and over
  the API both. The one key rule that would have refused an `@` guards element
  styles, and those rekey to `s` plus a hash.

**One thing worth knowing:** a copy of a copy strips the previous suffix
rather than appending, so a key cannot grow a chain of ids over repeated
copies. Added ids are minted as `n` and a base-36 timestamp, which is specific
enough to strip without disturbing a key that happens to contain an `@`.

Done for links as well as words, since a card's button is the other half of
the same fault: two copied cards pointing at one place.

### Fixed: a sentence changed in two places at once lost its arrangement
**Adapter:** all. **Found:** 2026-09-27. **Fixed:** 2026-09-29.

**Fixed.** Editing words on both sides of a bold phrase in one go used to
collapse the sentence's runs of text into one and leave the phrase trailing
it. No words were ever lost, which is why this sat at low severity, but the
designer's arrangement was.

The old question was whether the whole change fitted inside a single run, and
a change on both sides of the phrase does not. The better question is where
the boundary between the runs went, and an edit like that answers it: the
words immediately touching the phrase are exactly the ones nobody edited. In
"We design for the <b>street it stands on</b>, not a photograph", rewording
the first word and the last leaves "for the " and ", not a " untouched either
side of it, which is more than enough to say where the phrase still belongs.

So the appliers now locate each boundary against the unchanged characters
around it, and split the new words there. A split is only trusted where the
anchoring text runs on unbroken in **both** the old string and the new;
letters that survive a rewrite scattered about are not an anchor, and
insisting on contiguity in both is what still tells an edit from a rewrite.
A sentence genuinely replaced outright collapses exactly as before, because
nothing can be inferred there and guessing is how words were lost originally.

Whichever path is taken the shares tile the new words exactly, so the
invariant that mattered is unchanged: the arrangement can still be lost, a
word cannot.

**Done in both appliers**, which was the greater part of the work. The browser
applies this for most sites and the scanner applies it server-side for hosts
that render their own pages, and the same edit reading differently live and in
an export is worse than either being wrong. The PHP side works in characters
rather than bytes, so the multi-byte offsets the old code had to step around
cannot arise. Pinned in French as well as English.

**Worth keeping:** a guard on how much of the sentence survived overall was
written first and thrown away. It rejected "Call <a>us</a> or <a>write</a>
today" becoming "Ring ... now", where both words changed and both boundaries
were still sitting in untouched text. How much of a short sentence survives
says very little. What is touching the boundary says everything, and it is
the question actually being asked.

---

### Fixed: a lapsed licence took a static site's published words off the page
**Adapter:** plain HTML. **Recorded:** 2026-09-27. **Fixed:** 2026-09-29.
**Severity:** was high, and was a commercial decision rather than only a bug.

**Fixed.** An expired licence key now still reads. Writing with it is refused
exactly as before, so a lapse costs the editor and leaves the website alone,
which is what the other adapters always did.

The decision described below was never actually taken. The rule allowing
reads through a lapse was already written, already correct, and carried a
comment saying that taking a customer's website down over a licence is the
one thing this product promises not to do. It simply never ran: the
key-expiry check above it denied everything first, reads included. So this
was not a missing decision but a decision made and then made unreachable,
which is the kind that survives every review.

Two things stay refused, deliberately. A **revoked** key reads nothing,
because revoking is what you do to a key that has leaked. An expired
**session** reads nothing either: that is a person's credential with a
lifetime of its own and has nothing to do with whether the site is paid for.
Billing pauses editing by dating licence keys rather than revoking them,
which is what makes the distinction hold.

It was also more urgent than when recorded. It was written when nothing could
take a payment, so no customer could lapse and the fault was theoretical.
Payment collects now, plans expire, and the sweep runs daily.

The original finding follows, for the history.

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

### Fixed: a free photograph used as a background credited nobody
**Adapter:** all. **Recorded and fixed:** 2026-09-28.

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

**Fixed by keeping the photographer with the photograph.** The credit fields
travel with the style, the way they travel beside a picture, and the credits
page reads both. No new design decision was needed: that page already exists
precisely so nobody's hero gets a caption added to it.

The credit is stashed against the address it belongs to and sent only while
the field still holds that picture, so somebody who picks a photograph and
then pastes a different address over it cannot publish the first
photographer's name under the second one's work. No credit is a gap; the wrong
credit is a false statement about who took it.

Credits are never rendered as CSS: the renderer knows the visual props and
ignores the rest, which is what lets them ride along with a style rather than
needing a store of their own. A credit link is checked as an address for the
same reason a background image is.
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

### Installs that were never registered will stop editing on upgrade
**Adapter:** Laravel, WordPress, and any self-hosted install.
**Recorded:** 2026-09-28. **Updated:** 2026-09-29.
**Severity:** high on the day somebody upgrades. **That day has started.**

v0.11.0 is published, so this is live rather than pending. It reaches each
install the moment that install updates, which for the console is done and for
tokreamsblue is its next rebuild. WordPress joined the list in the same
release: the plugin used to permit an unregistered install too, which the
Laravel side had stopped doing months earlier.

The licence check used to permit anything it could not identify: an install
naming no site and holding no key was treated as licensed. That is now refused,
which is the point of registering at all, and it means any install running
without a licence today loses its editor the moment it takes this version.

Known to be in that state: the ShipFast marketing site and the console's own
marketing pages, which have no site or key configured at all, and tokreamsblue,
which is a live client on an old release with no licence configured. Their
websites are unaffected either way. What stops is the editing.

**Before deploying this anywhere:** register those sites and put their keys in
place. The strip that appears says what is missing and links to the page that
fixes it, so the failure is at least self-explanatory, but a client discovering
it on their own site is a worse way to find out than us doing it first.

## Settled, not open

Behaviour that looks like a fault, has been looked at, and is deliberately
staying as it is - whether the decision was the host's or ours. Kept in
writing because the question comes back, and because "we looked at it and
chose this" is worth more than silence the second time somebody asks.

These are not work. Counting them as work was making the register report more
outstanding than exists.

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
