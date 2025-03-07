import { screen, waitFor, cleanup } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import ThemeChangeSettings from "@/components/Settings/ThemeChangeSettings";
import { useTheme } from "@/providers/ThemeProvider";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/vitest';

// Mock the useTheme hook
vi.mock("@/providers/ThemeProvider", () => ({
  useTheme: vi.fn(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock the translation function
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key as-is for simplicity
  }),
}));

describe("ThemeChangeSettings", () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    (useTheme as Mock).mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders with current theme selected", async () => {
    renderWithProviders(<ThemeChangeSettings />);
    
    await waitFor(() => {
      const themeSelect = screen.getByTestId("theme-select");
      expect(themeSelect).toHaveTextContent("light");
    });
  });

  it("calls setTheme when a new theme is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeChangeSettings />);
    
    await waitFor(async () => {
      // Open the select dropdown
      const themeSelect = screen.getByTestId("theme-select");
      await waitFor(() => user.click(themeSelect));

      // Select the dark theme
      const darkOption = screen.getByText("dark");
      await waitFor(() => user.click(darkOption));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });
  });

  it("displays theme value from context", async () => {
    (useTheme as Mock).mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    });

    renderWithProviders(<ThemeChangeSettings />);
    
    await waitFor(() => {
      const themeSelect = screen.getByTestId("theme-select");
      expect(themeSelect).toHaveTextContent("dark");
    });
  });
}); 