import { beforeEach, describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import ForumPost from "@/components/ForumPost";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Post } from "@/plugintypes";
import { getPostDomain } from "@/lib/post-domain";

const PLUGIN_ID = "a7f3e9b2c1d4";
const mocks = vi.hoisted(() => ({ hasDomain: false }));

// The real provider, with this post's plugin swapped in: a plugin only gets a
// domain page when it defines onGetDomain, which loading sets as `hasDomain`.
vi.mock("@/hooks/usePlugins", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/usePlugins")>();
  return {
    ...actual,
    usePlugins: () => ({
      ...actual.usePlugins(),
      plugins: [{ id: PLUGIN_ID, name: "Test", hasDomain: mocks.hasDomain }],
    }),
  };
});

beforeEach(() => {
  mocks.hasDomain = false;
});

describe("getPostDomain", () => {
  it.each([
    ["https://github.com/automerge/automerge", "github.com"],
    ["https://www.nytimes.com/2026/10/30/tech.html", "nytimes.com"],
    ["https://i.redd.it/abc123.jpg", "i.redd.it"],
    ["https://en.wikipedia.org/wiki/Gata", "en.wikipedia.org"],
    ["http://EXAMPLE.com:8080/x", "example.com"],
  ])("%s -> %s", (url, domain) => {
    expect(getPostDomain(url)).toBe(domain);
  });

  it.each([
    [undefined],
    [""],
    ["/r/rust/comments/abc"],
    ["mailto:someone@example.com"],
    ["not a url"],
  ])("has no domain for %s", (url) => {
    expect(getPostDomain(url)).toBeUndefined();
  });
});

const emptyDoc: FavoritesDoc = {
  instances: {},
  posts: {},
  comments: {},
  communities: {},
  users: {},
} as FavoritesDoc;

const favoritesValue = {
  handle: { change: () => {}, doc: () => emptyDoc },
  doc: emptyDoc,
  isReady: true,
} as unknown as FavoritesContextValue;

const renderPost = (post: Partial<Post>) => {
  const { container } = renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <ForumPost
        post={{
          apiId: "p1",
          title: "Show HN: A thing I made",
          authorName: "someone",
          authorApiId: "someone",
          pluginId: PLUGIN_ID,
          ...post,
        }}
      />
    </FavoritesContext.Provider>,
  );
  return within(container);
};

describe("ForumPost domain", () => {
  it("shows the linked site beside the title", async () => {
    const view = renderPost({ url: "https://www.github.com/a/b" });
    expect((await view.findByTestId("post-domain")).textContent).toBe(
      "(github.com)",
    );
  });

  it("is plain text when the plugin has no domain page", async () => {
    const view = renderPost({ url: "https://github.com/a/b" });
    const label = await view.findByTestId("post-domain");
    expect(label.querySelector("a")).toBeNull();
  });

  it("links to the plugin's domain page when it has one", async () => {
    mocks.hasDomain = true;
    const view = renderPost({ url: "https://www.github.com/a/b" });
    const link = await view.findByRole("link", { name: "github.com" });
    expect(link.getAttribute("href")).toBe(`/s/${PLUGIN_ID}/domain/github.com`);
  });

  it("shows nothing for a text post", async () => {
    const view = renderPost({ url: undefined, body: "Ask HN: anything" });
    await view.findByText("Show HN: A thing I made");
    expect(view.queryByTestId("post-domain")).toBeNull();
  });
});
