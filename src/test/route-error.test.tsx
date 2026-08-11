import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./renderWithProviders";
import RouteErrorComponent from "@/components/RouteErrorComponent";
import { createPluginError } from "@/plugin-errors";

// Vitest globals are off, so testing-library's automatic cleanup isn't wired up.
afterEach(cleanup);

const renderError = (error: unknown, reset = vi.fn()) => {
  renderWithProviders(
    <RouteErrorComponent
      error={error as Error}
      reset={reset}
      info={{ componentStack: "" }}
    />
  );
  return reset;
};

// What a plugin's error actually looks like once plugin-frame has stripped it
// down to own enumerable properties.
const asPayload = (error: ReturnType<typeof createPluginError>) => ({
  ...error,
  message: error.message,
});

describe("RouteErrorComponent", () => {
  it("names the site and offers to open it when a request was blocked", async () => {
    const reset = renderError(
      asPayload(
        createPluginError({
          code: "blocked",
          message: "Reddit refused the request (403).",
          status: 403,
          requestUrl: "https://www.reddit.com/hot.json",
        })
      )
    );

    expect(
      await screen.findByText("www.reddit.com blocked this request")
    ).toBeDefined();
    const link = screen.getByRole("link", { name: "Open www.reddit.com" });
    expect(link.getAttribute("href")).toBe("https://www.reddit.com");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
  });

  it("retries by itself once the user comes back from the site", async () => {
    const reset = renderError(
      asPayload(
        createPluginError({
          code: "blocked",
          message: "blocked",
          status: 403,
          requestUrl: "https://www.reddit.com/hot.json",
        })
      )
    );

    // Returning without having been sent anywhere shouldn't refetch.
    window.dispatchEvent(new Event("focus"));
    expect(reset).not.toHaveBeenCalled();

    await userEvent.click(
      await screen.findByRole("link", { name: "Open www.reddit.com" })
    );
    window.dispatchEvent(new Event("focus"));
    expect(reset).toHaveBeenCalledTimes(1);

    // Only the one visit is honoured, so a later tab switch is not a refetch.
    window.dispatchEvent(new Event("focus"));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not send the user to the site for content that is simply private", async () => {
    renderError(
      asPayload(
        createPluginError({
          code: "forbidden",
          message: "private",
          status: 403,
          requestUrl: "https://www.reddit.com/r/secret/hot.json",
        })
      )
    );

    expect(await screen.findByText("Not available")).toBeDefined();
    expect(screen.queryByRole("link", { name: /^Open/ })).toBeNull();
  });

  it("falls back to generic copy when the site is unknown", async () => {
    renderError(new Error("Failed to fetch"));
    expect(await screen.findByText("Can't reach the site")).toBeDefined();
  });

  it("still renders for a rejection that carries no message at all", async () => {
    renderError(undefined);
    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });
});
