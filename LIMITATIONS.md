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

### Corrected: the misdiagnosis that started the React work
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
