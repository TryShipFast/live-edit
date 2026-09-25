# What this cannot do yet

Written from driving real sites, not from reading the code. Each entry says
what happens, why, and what a client would see — because the ones that cost
money are the ones nobody notices for weeks.

Measured on a WordPress 7.1 install running Astra + Elementor with the
Guitarist starter template, and on the WordPress theme unit test data.

## The page builder is a second source of truth

**What happens.** Elementor, Beaver Builder, Divi and the rest regenerate their
markup from their own store. An edit made here and an edit made there are two
answers to the same question, and the builder's answer wins the next time
anybody opens it and presses Update.

**What a client sees.** Their change disappears after somebody touches the page
in the builder. Nothing errors.

**Where we stand.** Not solved, and not solvable from inside the page. The
report names the builder when it finds one so the risk is at least stated
before anybody relies on it. For a site the client edits only through us, this
never fires.

## ~~A background only exists while it is on screen~~ — mostly fixed

**What happens.** A builder loads a container's background image when it
scrolls into view and lets it go again. Asked from the top of the document, the
element honestly reports no background at all — and one banner on the test page
reported `none` from anywhere except while it was actually on screen.

**Where we stand.** Three things now look, because no one of them is enough:

- at boot, for everything already resolved;
- as sections cross the viewport, asking again on each crossing rather than
  once — the flickering banner was never there on the first crossing, because
  the builder is reacting to the same scroll we are. Five tries per element,
  then it is left alone;
- when somebody presses **Edit site**, which is the one moment we know the page
  has finished doing whatever it was going to do.

Measured on the install: five of five, the flickering banner included, through
the plugin rather than the report tool.

**What is still true.** A background that has *never* been on screen in this
session and only exists while it is cannot be found — there is no moment at
which the browser would tell us about it. Scrolling past it once is enough, and
the editor picks it up without a reload.

## The editor is only wired into one of the two ways in

**What happens.** A site we sold loads `boot.js`, which walks through session,
tagging, content and then the editor. WordPress loads the editor directly,
because its plugin has already tagged the page and supplies its own token that
`boot.js` would overwrite with a null.

**Where we stand.** This bit us once already: the background pass lived only in
`boot.js`, so it ran everywhere *except* WordPress — the one place bought
templates actually live. Both entries now call the same idempotent function.
The lesson is the entry, not the feature: anything added to one path needs
asking of the other.

## A marked-up word inside a sentence is not separately editable

**What happens.** In `<p>Call <strong>today</strong> for a quote</p>` the
paragraph's own words are editable and `today` is not. The applier replaces
text nodes and leaves child markup alone, deliberately — writing markup from a
network response into a page is how a content service becomes a way to run
scripts on every visitor's browser.

**What a client sees.** They can rewrite the sentence around the bold word but
not the bold word itself.

**Where we stand.** Accepted. The paragraph being editable at all is recent;
before that a single `<code>` or `<abbr>` made the whole sentence uneditable,
which took one real page from 52% reachable to 92%.

## An anchor with no href, target or rel is left alone

**What happens.** Those three attributes are what distinguishes a link from a
control a script drives — a tab, an accordion, a lightbox trigger. An anchor
carrying none of them is not offered a destination.

**What a client sees.** A link the template built as a scripted control has no
address field.

**Where we stand.** Deliberate. Offering a web address for a tab toggle breaks
the tab, and that is the worse failure. A template that writes `href=""` or
keeps `target="_blank"` — which is what page builders actually do for an
unfilled link — is handled.

## Markup the scanner cannot see into

**Shadow roots and iframes.** A separate document; nothing in it is reachable.
The report counts both so the gap is visible rather than silent.

**Canvas and WebGL.** Pictures drawn rather than placed. Not addressable at
all.

## A theme that rewrites the page after we have written to it

**What happens.** Content is applied once. Anything that runs afterwards and
sets its own text or swaps its own images wins.

**Where we stand.** The report watches for this from before the page settles
and says how many rewrites it saw, with examples. When it reports none, a saved
edit will stick. There is no retry or re-application yet.

## ~~The WordPress plugin carries its own copy of the engine~~ — fixed

The plugin used to ship the scanner inside its zip, so a scanner improvement
reached a WordPress site only when somebody pressed update in wp-admin, while
the editor runtime beside it was fetched from the service on every page view.
One product at two speeds, and the slow half was the one deciding what a client
could edit.

The plugin now posts the page its theme rendered to `POST /{site}/prepare` and
serves what comes back — marked up, with the client's words already in it. It
carries no engine and no dependencies: 1712 files became 8.

Proven on the install by changing the scanner and reloading the site without
touching the plugin. Two tests hold it: the download must contain no
`vendor/shipfast/` and no `MarkupScanner.php`, and it must stay under sixty
files.

**What it costs.** A round trip on a cache miss, and a page render that depends
on the service being reachable. The finished page is cached against the
published version, so it is one call per page per publish, and an unreachable
service returns the theme's own markup — the visitor loses the editor, not the
website.

## Every page render needs the service

**What happens.** Falls out of the entry above, and out of content being ours
to hold rather than theirs. On a cache miss the host asks us for the prepared
page; if we are slow, their render is slow.

**Where we stand.** Cached for six hours or until a publish, and the timeout is
short enough that an outage degrades to the plain theme rather than a hang.
Measured: a 271KB Elementor page prepares in 0.23s. Not yet load-tested, and
there is no stale-while-revalidate — the first visitor after a publish pays the
round trip.

## Content saved before element names were remembered

**What happens.** Auto keys describe an element rather than naming it, so
improving the scanner can rename one. A map of what each element was last
called now travels with each page and carries content across a rename.

**Where we stand.** Sites tagged at runtime that saved content before that map
existed have nothing to carry from. Their first re-tag after a scanner change
can orphan content. Everything saved since is covered, and a test holds it.

## Not yet exercised

- The React adapter has not been re-run since the shared code changed.
- CloudFront in front of the asset addresses is untested.
- Content fetch has no retry: one failed request shows the theme's own words
  for that page view.
