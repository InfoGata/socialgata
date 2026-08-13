import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { renderWithProviders } from './renderWithProviders';
import { Index } from '@/routes';

describe('Index Route', () => {
  beforeEach(() => {
    cleanup();
  });

  // Without this the tree is still mounted when the file ends, and the plugin
  // load it started resolves against a torn-down jsdom.
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Index />);
    expect(screen).toBeDefined();
  });
}); 