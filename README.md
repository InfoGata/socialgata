# SocialGata

A unified social media aggregator that brings together content from multiple platforms into a single, customizable interface. Built with React, TypeScript, and modern web technologies.

## Features

- **Multi-Platform Support**: Aggregate content from Lemmy, Mastodon, Bluesky, and more via installable plugins
- **Dynamic Plugin System**: Install and manage plugins at runtime from a curated list or custom URLs
- **Instance Support**: Connect to different instances of federated platforms (Lemmy, Mastodon)
- **Dark/Light Theme**: Customizable UI with theme support
- **Modern UI**: Clean, responsive design using Tailwind CSS and Radix UI components

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router (file-based routing)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS with custom theme system
- **UI Components**: Radix UI + shadcn/ui
- **Testing**: Vitest with jsdom

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/socialgata.git
cd socialgata

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:3005`.

### Building for Production

```bash
# Run TypeScript checks and build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   └── ...           # Feature components
├── contexts/         # React contexts (PluginsContext, etc.)
├── routes/           # File-based routing (TanStack Router)
│   ├── plugins/      # Plugin-specific routes
│   └── ...
├── services/         # Service implementations and adapters
├── store/            # Redux store and slices
│   ├── authSlice.ts
│   └── uiSlice.ts
├── lib/              # Utilities and helpers
└── test/             # Test utilities and setup
```

## Available Scripts

- `npm run dev` - Start Vite development server (port 3005)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run preview` - Preview production build

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

Contributions are welcome! Please feel free to submit a Pull Request.

## License

AGPL-3.0 - GNU Affero General Public License v3.0
