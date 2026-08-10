import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./renderWithProviders";
import PostWithComments from "@/components/PostWithComments";
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

// Vitest globals are off, so testing-library's automatic cleanup isn't wired up.
afterEach(cleanup);

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
});
