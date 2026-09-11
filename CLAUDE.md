# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server on port 3005
- `npm run build` - Build for production (TypeScript compile + Vite build)
- `npm run lint` - Run ESLint with TypeScript support
- `npm test` - Run Vitest test suite

Ports are unique per app in `~/projects/webapps` and `strictPort` is on, so a
collision fails instead of drifting: dev 3005, preview 4005, electron renderer 5005.
The dev port is part of every plugin's OAuth redirect uri: a plugin derives it
from the app's origin as `<origin>/login_popup.html`, so on 3005 that is
`http://localhost:3005/login_popup.html`. Changing the port means re-registering
that uri with each provider (Dropbox, Reddit) or their sign-in stops matching.

## Project Architecture

### Core Framework
React 19 + TypeScript application using:
- **TanStack Router** for file-based routing (`src/routes/`)
- **Redux Toolkit** for state management (`src/store/`)
- **Vite** as build tool with `@/` path alias for `src/`

### Plugin Architecture
The app aggregates social media content through a dynamic plugin system.

**Dynamic Plugin System** (runtime-loadable):
- Modeled after InfoGata's plugin architecture
- `src/contexts/PluginsContext.tsx` - Plugin management context (load, add, update, delete)
- `src/hooks/usePlugins.ts` - Hook to access plugin context
- `src/database.ts` - IndexedDB storage via Dexie for plugins and auth
- `src/services/plugin-service-adapter.ts` - Wraps dynamic plugins to implement ServiceType
- `src/plugin-utils.ts` - Utilities for loading plugins from URL/FileList, ID generation
- `src/default-plugins.ts` - List of available plugins users can install
- `public/pluginframe.html` - Sandboxed iframe entry point for plugin execution
- Uses `plugin-frame` library for secure iframe communication
- Plugins stored in IndexedDB with `PluginInfo` schema (id, name, script, manifest, options)
- Plugin authentication stored separately in `pluginAuths` table

**Plugin Loading Flow**:
1. PluginsProvider loads all plugins from IndexedDB on app startup
2. Each plugin script executes in sandboxed iframe (10s timeout)
3. PluginServiceAdapter wraps plugin to match ServiceType interface
4. Components use `usePlugins()` hook to access loaded plugins

**Dev Plugin Auto-Reload**:
- Plugins installed from `localhost` URLs are auto-polled every 3 seconds for changes
- To develop a plugin locally: serve its folder (`npx serve . -p 8080 --cors`), install via URL (`http://localhost:8080/manifest.json`), then run the plugin build in watch mode
- Changes are detected by comparing script content and auto-applied (logged to console as `[dev] Auto-updating plugin: ...`)

**Routes** support plugin-based URLs: `/plugins/$pluginId/feed`
- Platform-specific instances: `/plugins/$pluginId/instances/$instanceId/feed`

**Platform-specific post components**:
- `ForumPost.tsx` - For forum-style platforms (Reddit, Lemmy)
- `MicroblogPost.tsx` - For microblogging platforms (Twitter, Mastodon, Bluesky)
- `ImageboardPost.tsx` - For imageboards (4chan, etc.)
- `PostComponent.tsx` - Main component that routes to platform-specific components
- `PostWithComments.tsx` - Displays posts with their comment threads

### Key Technical Patterns
- **Theme System**: Custom CSS variables with Tailwind, managed by ThemeProvider
- **Internationalization**: i18next with type-safe translations

- **Component Library**: Radix UI + shadcn/ui components in `src/components/ui/`

### State Management
Redux store with slices:
- `authSlice.ts` - Authentication state
- `uiSlice.ts` - UI preferences (theme, cloud sync settings, etc.)

**Favorites System** (uses React Context instead of Redux):
- **automerge-repo** for offline-first CRDT-based favorites
- `src/sync/FavoritesRepoProvider.tsx` - Sets up automerge-repo with IndexedDB storage
- `src/sync/FavoritesContext.tsx` - React Context for favorites document + CloudSyncManager integration
- `src/sync/favorites-repo.ts` - CRDT operations (toggle, check, get favorites)
- `src/sync/useFavorites.ts` - Custom hooks for favorites state
- `src/components/FavoriteButton.tsx` - Star button component (supports instances, communities, posts, comments)
- `src/routes/favorites.tsx` - Favorites page with tabs
- `src/components/CommunityFeed.tsx` - Displays community header with favorite button
- Supported items: instances, communities, posts, comments
- Storage: IndexedDB via `@automerge/automerge-repo-storage-indexeddb`
- Local sync: Cross-tab via BroadcastChannel
- Cloud sync: Provided by plugins implementing `onSyncUpload`/`onSyncDownload`

**Cloud Sync Architecture** (Hybrid Approach):
- **Primary storage**: IndexedDB (fast, offline-first)
- **Cloud backup**: Periodic uploads via sync-capable plugins
- **Conflict resolution**: Automerge CRDT automatically merges changes
- `src/sync/cloud/CloudSyncProvider.ts` - Interface for all cloud providers
- `src/sync/cloud/CloudSyncManager.ts` - Orchestrates sync operations (periodic uploads, downloads, CRDT merging). Uses a stable file ID (`socialgata-favorites`) so all devices share the same cloud file.
- `src/sync/cloud/PluginSyncProviderAdapter.ts` - Wraps a sync-capable plugin to implement `CloudSyncProvider`
- `src/components/Settings/CloudSyncSettings.tsx` - Settings UI for connecting providers
- Settings stored in Redux `uiSlice.cloudSync`: pluginId, enabled, autoSync, syncIntervalSeconds
- No setup to document: install a sync-capable plugin and connect it from
  Settings. The provider's client id lives in that plugin, not in this app's
  environment.

### Bundle
`autoCodeSplitting` on the tanstackRouter plugin gives each route its own
chunk, so a visit parses the shell plus the route being shown rather than all
thirty. The plugin must be listed **before** `react()` in `vite.config.ts` --
it rewrites route files and has to see them before JSX is transformed. The
build fails with an explicit plugin-order error if that is swapped.

This moves code off the critical path; it does not reduce what is eventually
downloaded, since the service worker precaches every chunk either way. hls.js
is separately lazy (a dynamic import in `VideoPlayer`). The automerge wasm
(~2.7MB) is still loaded at boot because the favorites repo is created above
the router.

### Service Worker / PWA
`vite-plugin-pwa` (same library as the other InfoGata apps) in `vite.config.ts`,
web build only — the electron and capacitor builds are not wired to it.
`registerType: "autoUpdate"` so a client on a stale precached shell recovers
without needing the page to post SKIP_WAITING.

The `navigateFallbackDenylist` is load-bearing: `public/` holds real pages
(`pluginframe.html`, `ui.html`, `login_popup.html`) and without the denylist the
SPA fallback hands them the app shell, which breaks every plugin. Any new file
added to `public/` is covered by the existing `/\.html$/` rule; anything
extensionless would need its own entry.

`maximumFileSizeToCacheInBytes` must stay above the automerge wasm (~2.7MB) or
the app installs and then won't open offline, and it fails silently.

### Versioning
`package.json` is the single source of truth; see the Versioning section of the
README. `build-info.ts` injects `__APP_VERSION__` and `__APP_COMMIT__` into both
vite configs, `src/lib/app-version.ts` is what the app reads, and
`android/app/build.gradle` derives `versionCode`/`versionName` from the same
file. Never hardcode a version anywhere else.

### Testing
Vitest with jsdom environment, testing utilities in `src/test/`