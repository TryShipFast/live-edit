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
