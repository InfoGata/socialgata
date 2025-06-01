# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with CORS proxy (port 3000)
- `npm run build` - Build for production (TypeScript compile + Vite build)
- `npm run lint` - Run ESLint with TypeScript support
- `npm test` - Run Vitest test suite

### Individual Commands
- `npm start` - Vite dev server only (without CORS proxy)
- `npm run cors-server` - CORS proxy server only

## Project Architecture

### Core Framework
React 18 + TypeScript application using:
- **TanStack Router** for file-based routing (`src/routes/`)
- **Redux Toolkit** for state management (`src/store/`)
- **Vite** as build tool with `@/` path alias for `src/`

### Plugin Architecture
The app aggregates social media content through a plugin system:
- Each platform has a service file in `src/services/` (reddit.ts, lemmy.ts, mastodon.ts, hackernews.ts)
- Routes support plugin-based URLs: `/plugins/$pluginId/feed`
- Platform-specific instances: `/plugins/$pluginId/instances/$instanceId/feed`

### Key Technical Patterns
- **Theme System**: Custom CSS variables with Tailwind, managed by ThemeProvider
- **Internationalization**: i18next with type-safe translations
- **CORS Handling**: Development proxy server (`cors-server.js`) for API requests
- **Component Library**: Radix UI + shadcn/ui components in `src/components/ui/`

### State Management
Redux store with slices:
- `authSlice.ts` - Authentication state
- `uiSlice.ts` - UI preferences (theme, etc.)

### Testing
Vitest with jsdom environment, testing utilities in `src/test/`