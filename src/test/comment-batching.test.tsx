import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./renderWithProviders";
import PostWithComments, { COMMENT_BATCH_SIZE } from "@/components/PostWithComments";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { GetCommentsResponse, Post } from "@/plugintypes";

const PLUGIN_ID = "2XJix5oj3Xqd";

const emptyDoc: FavoritesDoc = {
  instances: {},
  posts: {},
  comments: {},
  communities: {},
  users: {},
};

// Only the pieces of the automerge handle the favorite hooks touch.
const favoritesValue = {
  handle: { change: () => {}, doc: () => emptyDoc },
  doc: emptyDoc,
  isReady: true,
} as unknown as FavoritesContextValue;

const makeComments = (count: number): Post[] =>
  Array.from({ length: count }, (_, i) => ({
    apiId: `c${i}`,
    pluginId: PLUGIN_ID,
    authorName: `author${i}`,
    body: `comment body ${i}`,
  }));

const renderComments = (count: number) => {
  const data: GetCommentsResponse = { items: makeComments(count) };
  return renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <PostWithComments data={data} pluginId={PLUGIN_ID} />
    </FavoritesContext.Provider>,
  );
};

/**
 * jsdom has no requestIdleCallback, so idle backfill is off unless a test asks
 * for it. Chains through macrotasks rather than firing synchronously, so React
 * gets to commit each batch.
 */
const enableIdleBackfill = () => {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
    const timer = setTimeout(cb, 0);
    timers.add(timer);
    return timer as unknown as number;
  });
  vi.stubGlobal("cancelIdleCallback", (handle: number) => {
    clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
    timers.delete(handle as unknown as ReturnType<typeof setTimeout>);
  });
  return () => timers.forEach(clearTimeout);
};

// Vitest globals are off, so testing-library's automatic cleanup isn't wired up.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PostWithComments batching", () => {
  it("renders every comment when the thread is small", async () => {
    renderComments(5);

    expect(await screen.findByText("comment body 0")).toBeDefined();
    expect(screen.getByText("comment body 4")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Show more comments/ })).toBeNull();
  });

  it("renders only the first batch of a large thread", async () => {
    renderComments(60);

    expect(await screen.findByText("comment body 0")).toBeDefined();
    expect(screen.getByText("comment body 24")).toBeDefined();
    // Mounting all 60 at once is what made large threads block the main thread.
    expect(screen.queryByText("comment body 25")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show more comments (35 left)" }),
    ).toBeDefined();
  });

  it("reveals the next batch when the button is used", async () => {
    const user = userEvent.setup();
    renderComments(60);

    await user.click(
      await screen.findByRole("button", { name: "Show more comments (35 left)" }),
    );

    expect(screen.getByText("comment body 25")).toBeDefined();
    expect(screen.getByText("comment body 49")).toBeDefined();
    expect(screen.queryByText("comment body 50")).toBeNull();
  });

  it("shows the whole thread once every batch is revealed", async () => {
    const user = userEvent.setup();
    renderComments(60);

    await user.click(
      await screen.findByRole("button", { name: "Show more comments (35 left)" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Show more comments (10 left)" }),
    );

    expect(screen.getByText("comment body 59")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Show more comments/ })).toBeNull();
  });

  it("fills the rest of the thread in during idle time", async () => {
    const stopIdle = enableIdleBackfill();
    try {
      // One batch beyond the first, so the assertion doesn't hang on how fast
      // jsdom can mount comment trees while the rest of the suite runs.
      renderComments(COMMENT_BATCH_SIZE + 5);

      // Still only the first batch up front — that is what keeps first paint
      // off the critical path.
      expect(await screen.findByText("comment body 0")).toBeDefined();
      expect(screen.queryByText(`comment body ${COMMENT_BATCH_SIZE}`)).toBeNull();

      // ...but the rest arrives without anyone scrolling or clicking, so
      // find-in-page can reach every comment.
      await waitFor(
        () => {
          expect(screen.getByText(`comment body ${COMMENT_BATCH_SIZE + 4}`)).toBeDefined();
        },
        { timeout: 30000 },
      );
      expect(screen.queryByText(/Loading \d+ more comments/)).toBeNull();
    } finally {
      stopIdle();
    }
  });

  it("reports progress instead of a button while backfilling", async () => {
    const stopIdle = enableIdleBackfill();
    try {
      renderComments(60);

      // A button whose count ticks down on its own reads as broken. The exact
      // number is deliberately not asserted — backfill is already moving it.
      expect(await screen.findByText(/Loading \d+ more comments/)).toBeDefined();
      expect(screen.queryByRole("button", { name: /Show more comments/ })).toBeNull();
    } finally {
      stopIdle();
    }
  });
});
