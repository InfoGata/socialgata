# SocialGata

[![CI](https://github.com/InfoGata/socialgata/actions/workflows/ci.yml/badge.svg)](https://github.com/InfoGata/socialgata/actions/workflows/ci.yml)

Read Reddit, Lemmy, Mastodon, Bluesky, Hacker News, Lobsters and imageboards in
one place — through plugins you choose, on a site that stores none of it.

**[www.socialgata.com](https://www.socialgata.com)**

## What it is

SocialGata is a reader, not a service. It holds no accounts and no content of
its own. Each platform is a plugin, and when you open a feed that plugin fetches
from that platform directly, from your device, over your connection. Nothing is
copied to a server of ours on the way, because there isn't one.

That shapes everything else:

- **Your data stays yours.** Installed plugins, logins, favorites and settings
  live in your browser. There is no sign-up.
- **Works offline.** It installs as a PWA and opens without a connection.
  Favorites are a CRDT, so edits on two devices merge rather than clobber.
- **Sync is optional and yours to pick.** A sync plugin backs favorites up to
  storage you already have — Dropbox today — and nothing syncs without one.
- **Plugins are sandboxed.** Each runs in an iframe on its own origin, so one
  plugin can't read another's data or the page around it.

## Plugins

Nine ship in the catalog. Install what you want from the plugins page, or point
it at any manifest URL.

| Plugin | Needs |
| --- | --- |
| Lemmy, Mastodon, Bluesky | nothing |
| Hacker News, Lobsters | nothing |
| Imageboards (4chan, lainchan, leftypol, endchan, 2ch.hk) | nothing |
| Reddit | a Reddit account, **or** the browser extension |
| Twitter/X | the browser extension |
| Dropbox Sync | a Dropbox account |

### Why some need the extension

Some sites refuse requests that don't come from a page on their own domain, and
a browser enforces that. The [InfoGata
extension](https://github.com/InfoGata/infogata-extension) makes those requests
on the plugin's behalf, from your browser, on your connection. Plugins that
can't work without it are hidden rather than offered and broken.

Reddit is the exception: signing in uses an API that a plain browser can reach,
so an account works instead of the extension.

Adult content is withheld by default — a post or community the source marks as
adult is held behind a prompt until you ask for it. Settings has hide, ask and
show.

## Development

Requires Node 22 (what CI builds against).

```bash
git clone https://github.com/InfoGata/socialgata.git
cd socialgata
npm install
npm run dev          # http://localhost:3005
```

| | |
| --- | --- |
| `npm run dev` | dev server, port 3005 |
| `npm run build` | typecheck and build for production |
| `npm run preview` | serve the production build, port 4005 |
| `npm test` | Vitest suite |
| `npm run lint` | ESLint |
| `npm run electron:dev` / `electron:build` | desktop build (renderer on 5005) |
| `npm run android` | build and run via Capacitor |

Ports are fixed (`strictPort`), because plugin OAuth redirect URIs are derived
from the app's origin — drifting to another port breaks sign-in.

Built with React 19, TypeScript, Vite, TanStack Router, Redux Toolkit, Tailwind
and Radix/shadcn. Architecture notes for contributors are in
[CLAUDE.md](CLAUDE.md).

## Writing a plugin

A plugin is a manifest plus a script. It implements the `on*` callbacks it
supports — `onGetFeed`, `onGetCommunity`, `onGetComments`, `onSearch` and so on
— and the host calls whichever exist, so a plugin can be as small as one feed.

Types are published, and are the API contract:

```bash
npm install --save-dev @infogata/socialgata-plugin-typings
```

Every callback and every field is documented in
[index.d.ts](https://github.com/InfoGata/socialgata-plugin-typings/blob/master/index.d.ts).
The existing plugins under the [InfoGata org](https://github.com/InfoGata) are
working examples.
[hackernews](https://github.com/InfoGata/hackernews-socialgata) is the one to
read first — about 300 lines, a plain JSON api, and it needs neither auth nor
the extension, so nothing in it is there to work around a restriction.

To develop against a local copy: serve the plugin folder
(`npx serve . -p 8080 --cors`), install it by URL from the plugins page
(`http://localhost:8080/manifest.json`), and run the plugin's build in watch
mode. Plugins installed from localhost are polled every few seconds and reload
themselves as you build.

## Privacy

No accounts, no profiles, and no content passing through us. Anonymous,
cookieless analytics is on by default and can be turned off in Settings; Do Not
Track turns it off regardless, and a build with no analytics key configured
loads none at all. See [the privacy page](https://www.socialgata.com/privacy).

To report abuse or a copyright concern, and for what we can and can't act on,
see [ABUSE.md](ABUSE.md).

## Versioning

`package.json` holds the version, and nothing else should carry a copy of it.
`npm version <major|minor|patch>` is the only thing that changes it:

- the web and desktop builds read it through `build-info.ts`, which stamps in
  the commit (`git describe --always --dirty`) alongside it
- the Android build reads it in `android/app/build.gradle` and derives
  `versionCode` from it, so `0.1.0` becomes `100` and `1.2.3` becomes `10203`
- the About page shows both, and tapping the version copies the build, the
  platform and the user agent — everything a bug report needs

The app is pre-1.0 while the plugin API is still moving: a minor bump means
plugins may need changes, a patch means they won't.

## Contributing

Issues and pull requests are welcome. `npm run lint`, `npm test` and
`npm run build` all need to pass — CI runs the same three on every push, plus
the Electron build.

New plugins don't need to live here. Publish the manifest anywhere and it can
be installed by URL; the catalog in `src/default-plugins.ts` is a starting
point, not a permission list.

## License

[AGPL-3.0](LICENSE). If you run a modified copy as a service, the source has to
be available to its users.
