# Publishing @shipfasts/live-edit-react

A checklist, not an essay. Run everything from `packages/react`.

The scope `@shipfast` means npm defaults to a **restricted** package, which on
a free account fails with a 402 and on a paid one publishes something no
customer can install. `publishConfig.access` is set to `public` in
`package.json` so neither happens. Do not remove it.

## Before the first publish, once

1. The `@shipfast` org must exist on npmjs.com and the publishing account must
   be a member of it. Nobody owns the scope today: `npm view @shipfasts/live-edit-react`
   returns a 404. Create the org at npmjs.com/org/create if it is not there.
2. Turn on 2FA for the account if it is not already on. npm requires it for
   publishing to a new scope, and it is the only thing standing between a
   leaked token and a package every customer installs.

## Every publish

```bash
cd packages/react

npm whoami                      # confirms which account is about to publish
npm pack                        # writes a tarball, contacts nothing
tar -tzf shipfasts-live-edit-react-*.tgz   # bin/, src/, README.md, LICENSE, package.json
npm publish --otp=123456        # the six digits from your authenticator
```

If the account has 2FA set to "authorization only" rather than "authorization
and writes", drop `--otp` and npm will not ask. If it asks and you omit the
flag, npm prompts on the terminal; passing `--otp` just saves a round trip.

`npm publish` runs `npm pack` itself, so the pack step above is only there to
let you look at the tarball before it leaves the machine. Delete the `.tgz`
afterwards, it is not source.

What you are looking for is anything that is NOT `bin/`, `src/`, `README.md`,
`LICENSE` or `package.json` - a stray `.tgz`, `types-check/`, a `node_modules`.
This said "12 files" once and the package has grown since, which taught
whoever read it next to distrust the check rather than the count. The `files`
field in `package.json` is what decides this; the count is a consequence.

## Check afterwards

```bash
npm view @shipfasts/live-edit-react version    # the version you just sent
npm view @shipfasts/live-edit-react files      # not private, not empty

cd $(mktemp -d)
npm init -y >/dev/null
npm install @shipfasts/live-edit-react react@19
node -e "import('@shipfasts/live-edit-react').then(m => console.log(Object.keys(m)))"
npx live-edit-codemod --help
```

The import must list `LiveEditProvider` and `useContent`, and the codemod must
print its usage. Those two are exactly what the console's install card tells a
customer to do, so if either fails the card is lying.

Then open the console's install card for a React or Next.js site and follow it
word for word on a throwaway app. The card is the contract, not this file.

## Versions

The npm package tracks the engine's version, so `v0.10.0` of the PHP engine and
`0.10.0` on npm are the same release. A customer reporting a fault names one
number and it means the same thing in both places.

Bump `version` in `package.json` before publishing. npm refuses to overwrite a
published version, and unpublishing is only allowed for 72 hours, so a wrong
number is a wasted version rather than something to undo.

## After the first publish: releasing from CI

Configure the trusted publisher once, on npmjs.com, on this package's Settings
tab: GitHub Actions, organisation `TryShipFast`, repository `live-edit`,
workflow `publish-react.yml`.

From then on a release is:

```
# bump packages/react/package.json first, then
git tag react-v0.10.1 && git push origin react-v0.10.1
```

The prefix matters. This repository ships two packages from one history: a
plain `vX.Y.Z` tag is the PHP engine going to Packagist, and `react-vX.Y.Z` is
this one going to npm. They move on their own schedules, which is why the
composer rename went out as v0.10.1 while this package was still 0.10.0.

No token, no one-time code, nothing to leak. The workflow refuses to publish if
the tag and `package.json` disagree.

## The README on npm

npm renders the README from the tarball of the version being published, and
never looks at the repository. Fixing wording in git changes nothing on
npmjs.com until the next release carries it.
