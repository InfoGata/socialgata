# SocialGata

A unified social media aggregator that brings together content from multiple platforms into a single, customizable interface. Built with React, TypeScript, and modern web technologies.

## Features

- **Multi-Platform Support**: Aggregate content from Lemmy, Mastodon, Bluesky, Hacker News, and more via plugins
- **Plugin Architecture**: Extensible system for adding new social media platforms
- **Instance Support**: Connect to different instances of federated platforms (Lemmy, Mastodon)
- **Dark/Light Theme**: Customizable UI with theme support
- **Internationalization**: Multi-language support with i18next
- **Modern UI**: Clean, responsive design using Tailwind CSS and Radix UI components

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
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
# Start development server with CORS proxy (recommended)
npm run dev

# Or start Vite dev server only
npm start

# Run CORS proxy server separately
npm run cors-server
```

The app will be available at `http://localhost:3000` with the CORS proxy running on port 8085.

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
├── routes/           # File-based routing (TanStack Router)
│   ├── plugins/      # Plugin-specific routes
│   └── ...
├── services/         # Platform service implementations
│   ├── lemmy.ts
│   ├── mastodon.ts
│   ├── hackernews.ts
│   └── bluesky.ts
├── store/            # Redux store and slices
│   ├── authSlice.ts
│   └── uiSlice.ts
├── lib/              # Utilities and helpers
└── test/             # Test utilities and setup
```

## Available Scripts

- `npm run dev` - Start development server with CORS proxy (Vite on port 3000, CORS proxy on port 8085)
- `npm start` - Start Vite dev server only (port 3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run preview` - Preview production build
- `npm run cors-server` - Run CORS proxy server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

AGPL-3.0 - GNU Affero General Public License v3.0
