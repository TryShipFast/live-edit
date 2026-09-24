# KastsBuild Live Edit for WordPress

WordPress already has an editor, so it is worth being clear what this is for.

A theme's own copy — a hero headline, a strapline, the words on a button —
lives in template files rather than in a post. Changing it means editing PHP,
which is why agencies get asked to change a sentence. This makes that text
editable in the page itself, by the person whose site it is.

It does not touch posts, pages, or anything else WordPress already manages.
That is theirs.

## How it works

The rendered page is buffered and run through the same scanner every other
adapter uses, rather than a WordPress-shaped reimplementation. The tagging
rules are the product; a second copy of them would drift quietly, and nobody
would notice until a client's edits landed on the wrong element.

Published words are then substituted into the tagged markup, and the finished
page is cached.

## Setup

```bash
composer install     # in the plugin directory
```

Then **Settings → Live Edit**: the site slug, the API address, a publishable
key, and a secret key.

The secret key stays on the server. It is never printed into a page and is not
shown again after saving. What reaches the browser is a short-lived,
write-scoped session key, minted only for users holding the configured
capability — WordPress decides who may edit, because its users are not ours.

## Caching

Pages are cached against a *content stamp* rather than a version number. A site
with publishing turned off changes its words without ever moving a version, so
a cache keyed on the version alone keeps serving yesterday's page until its own
timer runs out. The stamp moves on every change, in either mode, and every
cached page falls away with it — no purging, and nothing to get wrong.

An editor never reads that cache. Visitors can wait a few seconds for a change
to reach them; the person who just pressed save cannot, because a page that
does not move reads as a save that failed — and the next thing they do is type
it again.

## What it deliberately leaves alone

WordPress's admin toolbar. It is only in the page for signed-in users, which is
exactly who is editing, so left alone it would be the majority of what the
editor offers — inviting someone to reword "Howdy" and then wondering why their
website had not changed.

## Publishing

If the content service holds changes back, the toolbar gains a **Publish**
button showing how many are waiting.

Publishing does not go through the content API. The key a page holds can write
drafts and deliberately cannot publish — deciding what the public sees is not
something to hand to a browser, where anyone who opens the source can read the
credential. Instead the editor asks this site, WordPress answers whether that
user may, and the secret key does the publishing from the server.

Without this the editor had no Publish button at all: someone could save
drafts indefinitely, watch the page not change, and have no way to release
them.

There is no preview link on WordPress, so that control is hidden rather than
shown doing nothing.
