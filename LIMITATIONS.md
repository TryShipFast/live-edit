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

### Mostly fixed: nothing said which engine the service was running

A cloud site is tagged by the console and saves through the console, so for
every customer who is not self-hosting, **the console's installed engine is the
product**. A fix released from this repository has not shipped to any of them
until somebody upgrades that application and deploys it.

On 2026-09-30 the console was running v0.11.0 while this repository stood at
v0.12.7: eight releases, thirty-eight commits. Two bugs were reported from
learnkasts.com that morning and both were already fixed here - the icon missing
from the inline tags, and the picture companion - so the reports read as fixes
that had not worked. The one genuinely new fault, item keys being refused, was
found only because the other two were chased first.

Nothing in the product would have said so. The console does not show its engine
version, the editor does not send one, and a site tagged by an old engine
carries no mark to say which engine tagged it. The only way to learn it is to
run `composer show` on the server, which nobody does while a customer is
waiting.

**Built in v0.12.10**, though not where this entry first proposed it. The
content API now answers with the version it is running:

```
curl -s -H "Authorization: Bearer <a site's publishable key>" \
  https://live.tryshipfast.com/api/live-edit/v1/<site>/plugin
```

The publishable key is printed in the page of every site that embeds the
editor, so anybody can ask from anywhere, with no credentials of ours.

It was added for the WordPress updater and turned out to matter far more
widely, within the hour. Not knowing production's version had already cost a
day twice over: once on learnkasts, where two of three reported faults were
fixes that had shipped and not deployed, and once immediately afterwards, when
a *local* `vendor/` directory was read as evidence about a *server* and nine
releases were wrongly described as undeployed. Production had been current all
along. Neither mistake survives one curl.

**Still not built:** the version on the console's site view, and in whatever
the editor reports when a save fails. The number is now askable, which was the
hard part, but a customer reporting a fault still cannot see it and neither can
anybody reading their report.

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
- **Nothing validates content keys against a declared list, or against a
  pattern.** Checked rather than assumed: saving a setting takes any shape of
  string, in the engine and over the API both. The one key rule that would
  have refused an `@` guards element styles, and those rekey to `s` plus a
  hash.

  Not *arbitrary*, though, and the difference has a bound worth stating: both
  save paths cap a content key at 200 characters, and a suffix spends about
  eleven of them. A hand-written base key longer than roughly 189 characters
  would derive into one the save refuses, so the copy could be added and not
  edited. Left rather than guarded, because the alternative is truncating the
  base, which trades a key nobody will ever write for the one property that
  makes this rule worth having: that the declaration stays recoverable.

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

### Fixed: installing the package could take a site down
**Adapter:** Laravel. **Found:** 2026-09-29 on a live site. **Fixed:** same day.
**Severity:** was total. Every page, 500.

**Fixed.** A site with no usable database now has nothing stored, which is an
ordinary state and exactly what a fresh install is. It renders the words
already in its templates, as it did before anybody installed anything.

What happened: an API-driven Laravel frontend added the engine. Its own pages
need no database, so its default connection had pointed at a SQLite file that
never existed on that server, harmlessly, for months. Nothing ever asked it
for anything. The first request for `live_edit_settings` threw and every page
on a live site answered 500.

The site was fine. The application needed no database. This package was the
only thing that did, and it took the whole site with it.

Two faults, and the second is the instructive one:

- **A guard that covered the wrong case.** `version()` already checked
  `Schema::hasTable()`, with a comment about upgrades running before
  migrations. But `hasTable()` needs a working connection to answer, so it
  throws rather than returning false when there is no database at all. The
  guard handled a missing table and not a missing database, and the second is
  what happens on a real install.
- **The next call along was unguarded.** With no version, the read falls
  through to composing from the database, and that query had nothing around
  it. A chain is only as guarded as its least guarded link.

**Two things came out of it.** `LIVE_EDIT_DB_CONNECTION` lets a host say where
this package's tables live, because until now it always took the application's
default and there was no way to say otherwise. And `Schema` is now asked on
the model's own connection rather than the default, which would have quietly
asked the wrong database once a connection was named.

**The rule this establishes, worth stating on its own:** installing this
package must not be able to break a site. Not degrade it, not slow it: break
it. Everything it reads from a host's database is now allowed to answer
"nothing", and a site that renders its own words is the correct outcome of
every failure here. Reported, never swallowed, because content that quietly
stops appearing is its own kind of outage.

**What it does not solve:** that site still has nowhere durable to keep words.
See the entry below.

---

### Fixed: a Laravel site with no database of its own could not keep content
**Adapter:** Laravel. **Found:** 2026-09-29. **Fixed:** 2026-09-30.

**Fixed, and the entry was wrong when it was written.** It said there was "no
switch to have the service keep it instead" and that nothing wired
`RemoteContent` together for a Laravel host. There was a switch, and it had
been there all along: `CloudInstall::script()` has always had two branches,
and setting a cloud host and site makes a Laravel page serve the same install
script a static or React site gets. The service holds the words, the browser
tags and applies them, and the host needs no database at all.

```
LIVE_EDIT_CLOUD_HOST=https://live.tryshipfast.com
LIVE_EDIT_CLOUD_SITE=your-slug
```

Two env lines rather than the week of work this entry predicted. What was
genuinely missing was that **nobody had ever been told a Laravel app could
choose it** - the install card taught the database arrangement as the only
one, and mentioned the other in a footnote headed "No database?", after the
reader had already been told to run a migration. The console now asks where
the words should live before giving any instructions, and shows only the
chosen path.

**What the switch did not do by itself**, and cost a live site two outages to
find: the rest of the package went on reading local content tables anyway. An
API-driven frontend has no such tables and its container filesystem is
replaced on every deploy, so it answered 500 after every single deployment.
Guarding each reader was treating the symptom; the site's owner asked the
right question, which was why a cloud install reads local settings at all.
`WhereTheWordsLive` now answers that once, and `PublishedContent` and the
tagging middleware both stop before the database.

**Still true and still worth saying to a customer:** SQLite on a container is
not an answer for these sites. The file is recreated empty on every deploy, so
a client would edit their home page, publish it, and lose every word the next
time anybody shipped.

### Partly fixed: translation is stored and served per locale, and nothing ever sets one
**Adapter:** all, WordPress measured. **Found:** 2026-09-29. **Severity:** low
today, high the day anybody builds the translation UI.

Every part of translation exists except the part that chooses a language.
Content keys are locale-prefixed, `Snapshot::compose()` fills untranslated
values from the default so a gap never renders blank, the WordPress table is
unique on `(content_key, locale, status)`, the content API takes `?locale=`
and `config('live-edit.locales')` is advertised in config.

Three breaks in the chain, and nothing reaches any of it:

- **The editor never sends a locale.** `live-edit.js` reads
  `window.liveEditLocale` in two places and nothing anywhere assigns it.
- **Media saves do not accept one.** `Media.php` calls `Content::put($key,
  $value, true)` with no locale, so alt text, credits and the source list are
  shared by every language. Right for the picture, wrong for its description.
- **The plugin never asks for one.** `Frontend.php` calls
  `Content::forViewer($editing)`, so a correctly stored `fr` row would not be
  served even if one existed.

**Why this is worth recording before the feature is built rather than after.**
The save path *does* accept a locale, and defaults it to `''`. So a
translation UI wired to the existing save - the obvious way to build it -
would write the French words at locale `''`, which is the same row as the
English. The unique key would replace rather than add. **Translating a page
would silently destroy the words being translated from.**

That cannot happen today only because there is no UI to trigger it. It is a
trap laid for whoever picks up the translation task, not a fault in what
ships.

**To close it:** wire the locale end to end - editor to save to serve, media
included - and prove a second locale round-trips, *before* any language menu
exists. The menu is the last piece, not the first.

**Not to be closed by:** putting a language switcher on the customer's site.
A visitor gets whichever locale the site asks for, through `data-locale` on
the script tag or the host's own i18n. A bought template designed monolingual
has no switcher in it, and adding one is the thing this product does not do.


**Updated 2026-09-30.** The half that silently lost content is closed; the half
that is a user interface is not.

A key is one canonical value with translations hanging off it, not seven
independent pieces of content, and nothing knew that. Editing the English on a
site running seven languages left six pages serving translations of the
sentence that had been replaced - the save worked, the editor reported success,
and the site looked finished while being wrong in five languages nobody on the
team reads.

Every translated row now records a fingerprint of the canonical words it was
written from, so staleness is *derived* by comparison rather than stored. A
canonical write updates nothing else, there is no cascade to get wrong, and no
row can disagree with another about what is stale. `GET /{site}/translations`
answers with what needs review, per language.

**A fingerprint rather than a version number, deliberately.** The obvious
design counts versions - French translated from 41, English now at 42, so
French is stale. It is wrong in one ordinary case: somebody edits the English,
looks at it, and undoes it. The counter has moved to 43 and every translation
is stale forever, though not one word of what they were translated from has
changed. A fingerprint has no such state, and undoing the edit makes them
current again, which is the truth. There is a test for exactly that.

**Nothing is overwritten and nothing offers to be.** Changing "Learn from the
best educators" to "Learn from Africa's leading educators" is a change of
meaning, and machine-translating over somebody's reviewed French without
telling them is a worse failure than leaving it stale and saying so. A stale
translation also keeps being served - flagged is not withdrawn, and a French
reader is better off with last month's French than with English.

**Still missing:** the editor has no language menu, no way to switch locale
while editing, and no banner saying six translations need review. The contract
is there and nothing reads it yet, which is the same shape of gap this entry
originally described, one layer up.
---

### A card wrapped in a link, with a link inside it, is a different tree in the browser
**Adapter:** all. **Found:** 2026-09-30 on a live site. **Severity:** high
where it occurs, and it occurs on catalogue pages, which is where the money is.

Reported as "the mapper detects a link but there is no way to edit the text",
on the commonest card there is: the whole tile is a link, and inside it are a
couple of paragraphs and a button that is also a link.

The mapper is not at fault. Given that markup it tags both paragraphs and
gives the inner link its own text and href keys, which was checked before
anything else was blamed. The fault is upstream of everybody: **a nested `<a>`
is invalid HTML**, and the browser does not merely tolerate it, it rebuilds
the tree.

Author's markup:

```html
<a class="card"><div><p>Learn to weld</p><div><a>Enrol now</a></div></div></a>
```

What a browser actually builds, measured in Chrome:

```html
<a class="card"></a>
<div>
  <a class="card"><p>Learn to weld</p></a>
  <div><a class="card"></a><a href="/enrol">Enrol now</a></div>
</div>
```

One anchor becomes **four**. The parser's adoption-agency algorithm splits the
misnested anchor and repeats it around each block it contained.

**Why that breaks content and not just clicking.** An auto key is a hash of
where an element sits: tag and sibling index up to the root. PHP's parser
keeps the anchors nested, so a server-tagged page derives keys from a tree no
browser will ever have. The browser then computes different keys for the same
elements. Saves are refused as **"Unknown setting"** for keys the server never
recorded, and elements are not where anything expects them.

**What was fixed:** the editor now stops the host's own click listeners
(`stopImmediatePropagation`), because a page using `wire:navigate` navigated
away while the drawer was opening - true regardless of the nesting, and worth
fixing on its own.

**What is not fixed, because it cannot be:** we do not control the parser.
Nothing this package does can make two parsers agree about invalid markup.

**What a site should do instead**, and it is the standard answer rather than
our invention: do not nest anchors. Make the card a plain container and give
the link a stretched hit area, which is one CSS rule:

```css
.card { position: relative }
.card a.stretched::after { content: ""; position: absolute; inset: 0 }
```

The card is then one anchor, the words inside it are ordinary elements, and
every parser agrees about the tree.

**To close it:** the scanner could refuse to tag inside a nested-anchor region
and say why, rather than tagging a tree the browser will rearrange. That turns
a silent wrong answer into a visible one, which is the most that can honestly
be done here.

---

### Mostly fixed: anything inside a .map() was not editable, which on a real page is most of it
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

**Closed for most shapes, across v0.12.0 to v0.12.10.** Keys are composed from
each row's own identity - `itemIdentity(post)`, never a position and never the
React `key`, which is routinely an array index and is not promised to survive a
refetch. Rows in a client component are fully editable, including add, remove
and reorder, because the array passes through `useLiveEditList` on its way to
`.map()`. Rows in a server component are editable but not rearrangeable, since
that passthrough is a hook; the marker that would advertise rearranging is
deliberately withheld rather than written and left unbacked.

**One shape remains, and it is the ordinary shape of an App Router page:** the
list in one file, the card in another, both rendered on the server. On the
client the row's identity travels in React context; there is no context in a
server component, so it would have to arrive as a prop - which means the
codemod editing the call site and the component's parameter list in two files,
in step. Not built.

What did get built is the tool saying so. A list it cannot reach is reported by
file and component name with the one-line workaround, instead of being absorbed
into a count where "no list here" and "a list I passed over" look identical.
That distinction is the whole reason this entry was worth writing: the original
measurement said 62 elements tagged, and read as coverage.

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

### Fixed: a replaced picture kept showing the theme's original
**Adapter:** all, WordPress worst. **Found:** 2026-09-29. **Fixed:** 2026-09-29.
**Severity:** was high, and was not in this register until it was found.

**Fixed.** `src` is the last thing a browser consults. A `srcset` on the image
beats it, and a `<source>` inside a surrounding `<picture>` beats both. Both
appliers set `src` and left those behind, so the picture on the page stayed
the theme's on every screen the old list covered, which is every phone and
most laptops.

**Corrected 2026-09-29: this was not a live-site-only fault, and describing it
as one understated it.** Saves reload the page, and the reload renders through
these same appliers. The drawer's preview is a separate element and always
showed the new picture, so the sequence a client actually met was: replace a
picture, see it in the drawer, press Save, read "Saved", watch the page reload
- and find the old photograph still there.

That is a worse failure than the one first written down, and a different one
to diagnose. It does not look like a responsive-images subtlety on the live
site. It looks like saving is broken, immediately, in front of the person
doing it, whose reasonable next move is to try again.

Found while reading the area around the fitted-picture entry below, not by a
customer, and reachable rather than theoretical: WordPress puts a `srcset` on
content images by itself, so a bought theme carries one almost everywhere.

The sharpest part is that the rule was already written down. The browser's
repair path clears `srcset` when it puts a picture back and says why in a
comment: a responsive source list outranks `src`. Neither applier acted on it,
and nothing tested an applier against a themed image, so a rule the codebase
knew was never applied where it mattered most.

Both appliers now take the source list away with the replacement, including
the `<source>` elements of a surrounding `<picture>`, which outrank the image
entirely and would otherwise keep the theme's art direction over the client's
picture. `sizes` goes too: it describes an arrangement that no longer exists.
An image nobody replaced keeps everything, because a theme's own responsive
pictures are one of the things it was bought for.

**Related:** the entry below is the other half of the same subject and is
still open. With the theme's list gone, a replaced picture is now served as
exactly one file at one size, which is what that entry is about.

---

### Fixed: a fitted picture was served at one size to every screen
**Adapter:** WordPress. **Recorded:** 2026-09-27. **Fixed:** 2026-09-29.

**Fixed.** A replacement is now fitted to its box at more than one density and
carries a source list saying so, so a phone downloads the smaller file and a
laptop the larger. It used to be one file, made at 2x, sent to everything.

**Why `x` descriptors and not `w`.** The box is a known size in CSS pixels,
which is exactly what `1x` and `2x` describe, and they need no `sizes`
attribute beside them. Width descriptors would, and `sizes` is a description
of the page's layout: the theme's business, and not something derivable from
one box. Picking the descriptor that matches what we actually know is what
kept this small.

**No regression is possible on the `src`.** It is still the largest file,
which is what this always returned. A browser that does not read a source list
behaves exactly as it did before; one that does picks the smaller file on a
screen that cannot show the difference. The smaller copy is only made when it
is genuinely smaller, so a source too poor for two densities gives one file
and no list, which is honest rather than the same file offered twice.

**The part that needed care is a stale list, not a missing one.** A source
list outranks `src`, so one left behind from the previous picture keeps
showing the photograph that was just replaced. That is the fault recorded
above as the appliers failing to clear the theme's, and it would have been
reintroduced from the other end by writing a list on upload and leaving it
there. So the value is written on every change of picture, including a pasted
address and a removal, both of which correctly store nothing: those are files
we did not make and know no sizes for.

**Where it lives.** Beside the picture under the same suffix convention as the
alt text, `keySrcset`, which needed nothing new from the editor, the protocol
or the content model. Both appliers apply it in the same order: `src` first,
which takes the theme's list away, then the replacement's own list back.

**Tested where it can be.** The appliers are pinned on both sides, including
that an empty list clears the attribute rather than writing `srcset=""`, which
is a source list saying nothing and is not the same as having none. The
descriptor is pinned away from WordPress because its failure is silent: one a
browser cannot parse invalidates the whole list, the page falls back to `src`,
and it looks exactly right - correct picture, largest file, every phone.
Making the files themselves needs an image editor and a library, and is not
covered here.

**Still true, and still deliberate:** the fitted copies stay out of the
attachment's size metadata, so a thumbnail regeneration cannot delete a file
the page points at. They are recorded in the plugin's own bookkeeping instead
and removed with the picture.

### Fixed: the two ways of registering a site disagreed about what that means
**Adapter:** all. **Found:** 2026-09-29. **Fixed:** 2026-09-29.

**Fixed.** A site could be registered from the console's form or from
`live-edit:site create`, and the two produced different things. The form went
through the Provisioner and got a domain, a verification code, a platform and
both keys, dated. The command wrote the row itself and got a slug, a name and
an origin list - no domain, so the licence was for no website and the origin
check had nothing to compare against; no verification code, so it could never
be verified; and no keys at all, so registering was two commands and the
second was easy to miss.

Harmless while the command was a developer's convenience, which is what it had
always been. It stopped being harmless the moment the entry below made
registering sites urgent, because a command is what somebody reaches for under
time pressure, and a half-made site does not fail in the terminal - it fails
later and somewhere else, as a licence refusal on a customer's page.

Both ways in now go through the Provisioner, so there is one definition of a
registered site. The command gained `--domain` and `--platform`, prints both
keys once with the warning that they are kept only as hashes, and says plainly
when a licence has been made for no website.

**Pinned by comparison rather than by inventory.** The test registers a site
both ways and asserts the two agree, instead of listing the fields a
registered site happens to have today. A field added to one path and not the
other is exactly the fault this existed to catch, and an inventory test would
have gone on passing through it.

**A second half stays with the console, deliberately.** Registering a site has
two parts and only one of them is the engine's. The engine answers "may this
key touch this site", a question about a request with no owner and no reader
in it. An owner, a plan, a timezone and the record of who may sign in belong
to the console, and a command in a package installed on customers' servers
cannot set them.

So a site registered by the command on a console deployment is correctly
licensed and invisible in the sites list, on no plan, and impossible for its
owner to sign in to - they are sent to a sign-in with no account, on their own
site. The command now prints what it did and did not do, every time.

That is printed rather than documented for a specific reason: making the
command complete enough to trust is what makes it dangerous. It was
recommended in conversation the same day for two console-managed sites, on
the strength of having just been improved, and the recommendation was wrong.
The fix that removes one trap is exactly the sort of change that sets the
next one.

Found while working out how to make the registrations below safe to perform,
rather than by running it.

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

**Decided 2026-09-29: tokreamsblue is left alone.** The client updates his own
site and takes the current release when he does. We are not registering it for
him, and nobody should touch that deployment on his behalf.

The consequence, written down rather than assumed, because the decision and
the consequence point the same way and it would be easy to read that as
nothing to do: **his update is the event that turns editing off.** Not a
separate risk that might arrive later - the same act. A site taking this
version without a site id and key in its environment is refused, which is the
whole point of the change.

So whatever else happens, the licence has to be in place before or with that
rebuild, not after it. Two things are needed and neither is the update: the
site registered in the console, which is what issues the keys, and
`LIVE_EDIT_SITE_ID` and `LIVE_EDIT_APP_KEY` set in its environment. Which of
those is already true is not knowable from outside the console, and the
register has only ever said "no licence configured", which covers both.

Worth being exact about what "update" means here, since it is easy to picture
a plugin. **tokreamsblue is Laravel on cPanel, not WordPress.** The engine is
compiled into the site's own Vite bundle, so taking a new version is a
rebuild and redeploy of the site - `--with-vendor`, because the engine repo is
private - rather than anything that can be pressed in an admin screen. That is
also why this arrives on a day somebody chooses rather than on its own.

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
