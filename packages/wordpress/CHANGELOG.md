# ShipFast Live Edit for WordPress

## 0.11.0

The first release since plans were enforced, so most of this is a customer
being told things they were not told before.

**A lapsed licence now says renew.** It said "Invalid or missing API key",
which is the one message guaranteed to send somebody hunting through their
dashboard for a key that was never the problem. A refused save said "Sorry,
you are not allowed to do that". Both now say what happened, and the save
refusal comes back as 402 rather than 401: this is not "you may not", it is
"this needs paying for".

**Page limits.** A plan can cover fewer pages than the site has. Over the
allowance the page is served exactly as a visitor sees it, published words and
all, with a dismissable strip saying why the editor is not there and where to
go. Nothing about the website itself changes, here or anywhere else.

**Every page is its own page.** Without pretty permalinks WordPress calls them
all "/", and the plugin took that at face value, so every page of such a site
shared one set of keys: editing About wrote over the home page. Sites with
permalinks switched on are unaffected and nothing is re-tagged for them.

**The service address is filled in.** It was an empty box every customer typed
by hand, and a URL typed by hand is a URL with a typo in it.

### Upgrading

Replace the plugin folder, or upload the zip through Plugins → Add New →
Upload. Settings are untouched.

Built with `bin/build-wordpress-plugin`, which takes the version from the
plugin header so the file cannot claim to be something the code is not.
