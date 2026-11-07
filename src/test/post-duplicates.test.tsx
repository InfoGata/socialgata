import { beforeEach, describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import PostWithComments from "@/components/PostWithComments";
import PostDuplicates from "@/components/PostDuplicates";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Post } from "@/plugintypes";

const PLUGIN_ID = "a7f3e9b2c1d4";

const mocks = vi.hoisted(() => ({ hasDuplicates: false }));

// A plugin only gets an "other discussions" link when it defines
// onGetPostDuplicates, which loading sets as `hasDuplicates`.
vi.mock("@/hooks/usePlugins", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/usePlugins")>();
  return {
    ...actual,
    usePlugins: () => ({
      ...actual.usePlugins(),
      plugins: [
        {
          id: PLUGIN_ID,
          name: "Test",
          platformType: "forum",
          hasDuplicates: mocks.hasDuplicates,
          hasDefined: new Proxy({}, { get: () => async () => false }),
        },
      ],
    }),
  };
});

beforeEach(() => {
  mocks.hasDuplicates = false;
});

const emptyDoc = {
  instances: {},
  posts: {},
  comments: {},
  communities: {},
  users: {},
} as unknown as FavoritesDoc;

const favoritesValue = {
  handle: { change: () => {}, doc: () => emptyDoc },
  doc: emptyDoc,
  isReady: true,
} as unknown as FavoritesContextValue;

const post: Post = {
  apiId: "1xphc5f",
  title: "Project 2027",
  authorName: "someone",
  authorApiId: "someone",
  communityApiId: "StallmanWasRight",
  communityName: "r/StallmanWasRight",
  url: "https://example.com/rfc",
  pluginId: PLUGIN_ID,
};

const render = (ui: React.ReactElement) => {
  const { container } = renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      {ui}
    </FavoritesContext.Provider>,
  );
  return within(container);
};

describe("Other discussions link", () => {
  it("is absent when the plugin can't list them", async () => {
    const view = render(
      <PostWithComments data={{ items: [], post }} pluginId={PLUGIN_ID} />,
    );
    await view.findAllByText("Project 2027");
    expect(view.queryByRole("link", { name: /other discussions/i })).toBeNull();
  });

  it("links to the post's duplicates page", async () => {
    mocks.hasDuplicates = true;
    const view = render(
      <PostWithComments data={{ items: [], post }} pluginId={PLUGIN_ID} />,
    );
    const link = await view.findByRole("link", { name: /other discussions/i });
    expect(link.getAttribute("href")).toBe(
      `/s/${PLUGIN_ID}/c/StallmanWasRight/post/1xphc5f/duplicates`,
    );
  });

  it("uses the bare post route when the post has no community", async () => {
    mocks.hasDuplicates = true;
    const view = render(
      <PostWithComments
        data={{ items: [], post: { ...post, communityApiId: undefined } }}
        pluginId={PLUGIN_ID}
      />,
    );
    const link = await view.findByRole("link", { name: /other discussions/i });
    expect(link.getAttribute("href")).toBe(
      `/s/${PLUGIN_ID}/post/1xphc5f/duplicates`,
    );
  });
});

describe("PostDuplicates", () => {
  it("names the original post and lists the others", async () => {
    const view = render(
      <PostDuplicates
        pluginId={PLUGIN_ID}
        data={{
          post,
          items: [
            { ...post, apiId: "abc", title: "Same link elsewhere", communityApiId: "linux" },
          ],
        }}
      />,
    );
    const original = await view.findByRole("link", { name: "Project 2027" });
    expect(original.getAttribute("href")).toBe(
      `/s/${PLUGIN_ID}/c/StallmanWasRight/post/1xphc5f`,
    );
    expect(await view.findByText("Same link elsewhere")).toBeTruthy();
  });

  it("says so when there are none", async () => {
    const view = render(
      <PostDuplicates pluginId={PLUGIN_ID} data={{ post, items: [] }} />,
    );
    expect(await view.findByText("No other discussions")).toBeTruthy();
  });
});
