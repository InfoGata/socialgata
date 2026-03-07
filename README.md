# SocialGata

A unified social media aggregator that brings together content from multiple platforms into a single, customizable interface. Built with React, TypeScript, and modern web technologies.

## Features

- **Multi-Platform Support**: Aggregate content from Lemmy, Mastodon, Bluesky, and more via installable plugins
- **Dynamic Plugin System**: Install and manage plugins at runtime from a curated list or custom URLs
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
# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

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

- `npm run dev` - Start Vite development server (port 3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run preview` - Preview production build

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

AGPL-3.0 - GNU Affero General Public License v3.0
