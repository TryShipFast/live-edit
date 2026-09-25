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

## A background only exists while it is on screen

**What happens.** A builder loads a container's background image when it
scrolls into view and lets it go again. Asked from the top of the document, the
element honestly reports no background at all.

**Measured.** Five CSS backgrounds on one page; one of them came and went
depending on where the page was scrolled.

**Where we stand.** The runtime resolves backgrounds at boot, so anything in or
near the first screen is found. Everything further down is found only if the
page has been scrolled past it. The report sweeps the whole page and resolves
as it goes, which is why its count can exceed what the editor offers on a cold
load.

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

## The WordPress plugin carries its own copy of the engine

**What happens.** The plugin ships the scanner source inside its zip, so a
scanner improvement reaches a WordPress site only when the plugin is updated —
unlike the editor runtime, which is fetched from the service and is current on
every page view.

**Where we stand.** Known and asymmetric. The runtime half was fixed; the
scanner half still needs a plugin update. A test fails the build if any adapter
reintroduces a bundled copy of the *runtime*.

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
