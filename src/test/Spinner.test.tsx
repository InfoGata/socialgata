import { describe, it, expect, beforeEach } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import Spinner from "@/components/Spinner";
import '@testing-library/jest-dom/vitest';

describe("Spinner", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should render when open prop is true", async () => {
    renderWithProviders(<Spinner open={true} />);
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    })
  });

  it("should render when open prop is not provided", async () => {
    renderWithProviders(<Spinner />);
    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("should not render when open prop is false", () => {
    renderWithProviders(<Spinner open={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
}); 