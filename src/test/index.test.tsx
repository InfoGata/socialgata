import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { renderWithProviders } from './renderWithProviders';
import { Index } from '@/routes';

describe('Index Route', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Index />);
    expect(screen).toBeDefined();
  });

  it('renders PluginFeedButtons for all plugins', async () => {
    renderWithProviders(<Index />);

    // Check for all plugin buttons (excluding Twitter which requires CORS disabled)
    const pluginIds = ['reddit', 'mastodon', 'lemmy', 'hackernews', 'bluesky'];

    await waitFor(() => {
      pluginIds.forEach(pluginId => {
        const pluginElement = screen.getByTestId(`plugin-feed-${pluginId}`);
        expect(pluginElement).toBeInTheDocument();
      });
    });
  });

  it("renders the correct number of PluginFeedButtons", async () => {
    renderWithProviders(<Index />);

    // This assumes PluginFeedButtons has a data-testid attribute
    await waitFor(() => {
      const pluginButtons = screen.getAllByTestId(/^plugin-feed-/);
      // expect length of 5 or more
      expect(pluginButtons).lengthOf.greaterThanOrEqual(5);
    });
  });
}); 