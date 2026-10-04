# Live Edit for WordPress

Lets the site owner edit your theme's own words on the page itself.

WordPress already edits posts and pages. It cannot edit the text baked into
template files: a hero headline, a strapline, the words on a button. Changing
those means editing PHP, which is why agencies get asked to change a sentence.
This makes that text editable by the person whose site it is.

It does not touch posts, pages, menus or media. Those are WordPress's.

## Setup

Three steps.

**1.** Install the plugin, then from the plugin directory:

```bash
composer install
```

**2.** Go to **Settings → Live Edit** and fill in four fields:

| Field | Where it comes from |
| --- | --- |
| Site slug | your console |
| API address | filled in for you |
| Publishable key | your console |
| Secret key | your console |

**3.** Visit any page of your site while signed in. The toolbar appears.

The secret key stays on the server. It is never printed into a page and is not
shown again after saving. What reaches the browser is a short-lived session key
that can write drafts and nothing else.

## Who can edit

WordPress decides, not us. Anyone holding the configured capability gets the
editor. Everyone else gets the normal page.

## Locking the parts a client must not change

New in 0.14.

Wrap anything the client should not touch:

```php
<nav data-live-lock>
  <?php wp_nav_menu(); ?>
</nav>
```

A nav, a footer, a pricing table, a legal line. Mark it in the template, where
it is reviewable and survives a redeploy.

Then it depends who is looking:

| Who | What they get |
| --- | --- |
| You (can `edit_theme_options`) | everything, including locked parts |
| The client | everything except the locked parts |

Locked means fully refused, not just the text. The client cannot reword it,
restyle it, or reorder the links inside it.

The default is the `edit_theme_options` capability, on the reasoning that
whoever may edit the theme is the person who wrote the lock. Change it with a
filter:

```php
add_filter('kastsbuild_may_edit_locked_regions', function ($may, $user) {
    return user_can($user, 'manage_options');
}, 10, 2);
```

**`data-live-lock` is not `data-no-edit`.** They sound similar and do opposite
jobs:

- `data-no-edit` means "this is not the site". A toolbar, a debug bar.
  Nobody edits it, including you.
- `data-live-lock` means "this *is* the site, and it is not the client's".
  You still edit it. They do not.

## Publishing

If your plan holds changes back, the toolbar gains a **Publish** button showing
how many are waiting.

Publishing does not go through the content API. The key in the page can write
drafts and deliberately cannot publish, because deciding what the public sees
is not something to hand to a browser where anyone can read the credential.
The editor asks WordPress, WordPress answers whether that user may, and the
secret key publishes from the server.

There is no preview link on WordPress, so that control is hidden rather than
shown doing nothing.

## How it works

The rendered page is buffered and run through the same scanner every other
adapter uses, rather than a WordPress-shaped reimplementation. Published words
are substituted into the tagged markup, and the finished page is cached.

Pages are cached against a content stamp rather than a version number. A site
with publishing turned off changes its words without ever moving a version, so
a cache keyed on the version alone would serve yesterday's page until its timer
ran out. The stamp moves on every change, and every cached page falls away with
it. Nothing to purge.

An editor never reads that cache. Visitors can wait a few seconds for a change
to reach them. The person who just pressed save cannot, because a page that
does not move reads as a save that failed, and the next thing they do is type
it again.

## What it leaves alone

WordPress's admin toolbar. It is only in the page for signed-in users, which is
exactly who is editing, so left alone it would be most of what the editor
offers. That means inviting someone to reword "Howdy" and then wondering why
their website had not changed.
