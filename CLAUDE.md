# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with CORS proxy (Vite on port 3000, CORS proxy on port 8085)
- `npm run build` - Build for production (TypeScript compile + Vite build)
- `npm run lint` - Run ESLint with TypeScript support
- `npm test` - Run Vitest test suite

### Individual Commands
- `npm start` - Vite dev server only on port 3000 (without CORS proxy)
- `npm run cors-server` - CORS proxy server only on port 8085

## Project Architecture

### Core Framework
React 18 + TypeScript application using:
- **TanStack Router** for file-based routing (`src/routes/`)
- **Redux Toolkit** for state management (`src/store/`)
- **Vite** as build tool with `@/` path alias for `src/`

### Plugin Architecture
The app aggregates social media content through a hybrid plugin system supporting both built-in and dynamic plugins.

**Built-in Plugins** (static):
- Each platform has a service file in `src/services/` (lemmy.ts, mastodon.ts, bluesky.ts, twitter.ts)
- Implement the `ServiceType` interface from `src/types.ts`
- `src/services/selector-service.ts` - Factory for resolving plugin services by ID

**Dynamic Plugin System** (runtime-loadable):
- Modeled after ReaderGata's plugin architecture
- `src/contexts/PluginsContext.tsx` - Plugin management context (load, add, update, delete)
- `src/hooks/usePlugins.ts` - Hook to access plugin context
- `src/database.ts` - IndexedDB storage via Dexie for plugins and auth
- `src/services/plugin-service-adapter.ts` - Wraps dynamic plugins to implement ServiceType
- `src/plugin-utils.ts` - Utilities for loading plugins from URL/FileList, ID generation
- `src/components/PluginServiceSync.tsx` - Syncs plugin context with service selector
- `public/pluginframe.html` - Sandboxed iframe entry point for plugin execution
- Uses `plugin-frame` library for secure iframe communication
- Plugins stored in IndexedDB with `PluginInfo` schema (id, name, script, manifest, options)
- Plugin authentication stored separately in `pluginAuths` table

**Plugin Loading Flow**:
1. PluginsProvider loads all plugins from IndexedDB on app startup
2. Each plugin script executes in sandboxed iframe (10s timeout)
3. PluginServiceAdapter wraps plugin to match ServiceType interface
4. Service selector checks dynamic plugins first, falls back to built-in

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
- **CORS Handling**: Development proxy server (`cors-server.js`) for API requests
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
- Cloud sync: Dropbox (with Google Drive, OneDrive planned)

**Cloud Sync Architecture** (Hybrid Approach):
- **Primary storage**: IndexedDB (fast, offline-first)
- **Cloud backup**: Periodic uploads to cloud storage providers
- **Conflict resolution**: Automerge CRDT automatically merges changes
- `src/sync/cloud/CloudSyncProvider.ts` - Interface for all cloud providers
- `src/sync/cloud/CloudSyncManager.ts` - Orchestrates sync operations (periodic uploads, downloads, CRDT merging)
- `src/sync/cloud/DropboxSyncProvider.ts` - Dropbox OAuth + file upload/download implementation
- `src/routes/auth/dropbox/callback.tsx` - OAuth callback handler
- `src/components/Settings/CloudSyncSettings.tsx` - Settings UI for connecting providers
- `src/components/SyncStatusIndicator.tsx` - Optional status indicator for header
- Settings stored in Redux `uiSlice.cloudSync`: provider, enabled, autoSync, syncIntervalSeconds
- Environment variables: `VITE_DROPBOX_CLIENT_ID`, `VITE_DROPBOX_REDIRECT_URI`
- Setup docs: `docs/CLOUD_SYNC_SETUP.md`

### Testing
Vitest with jsdom environment, testing utilities in `src/test/`