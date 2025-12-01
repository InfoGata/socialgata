import { describe, it, expect, beforeEach } from 'vitest';
import { screen, cleanup } from '@testing-library/react';
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
}); 