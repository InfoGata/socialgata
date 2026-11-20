import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import PostWithComments from "@/components/PostWithComments";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { GetCommentsResponse, Post } from "@/plugintypes";
import {
  imageboardPostAnchor,
  parseImageboardAnchor,
} from "@/lib/imageboard-anchor";

const PLUGIN_ID = "IB4ch4nPl9n";
const INSTANCE_ID = "leftypol";
const BOARD_ID = "leftypol";
const THREAD_ID = "2005272";

vi.mock("@/hooks/usePlugins", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/usePlugins")>();
  return {
    ...actual,
    usePlugins: () => ({
      ...actual.usePlugins(),
      plugins: [
        {
          id: PLUGIN_ID,
          name: "Imageboard",
          platformType: "imageboard",
          hasDefined: new Proxy({}, { get: () => async () => false }),
        },
      ],
    }),
  };
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

const op: Post = {
  apiId: THREAD_ID,
  number: Number(THREAD_ID),
  title: "Thread title",
  pluginId: PLUGIN_ID,
  instanceId: INSTANCE_ID,
  communityApiId: BOARD_ID,
};

// Far more replies than one batch, so a link to the last one has to pull in
// batches that wouldn't otherwise be mounted yet.
const replies: Post[] = Array.from({ length: 60 }, (_, i) => ({
  apiId: String(2958441 + i),
  number: 2958441 + i,
  body: `reply body ${i}`,
  pluginId: PLUGIN_ID,
  instanceId: INSTANCE_ID,
  communityApiId: BOARD_ID,
}));
const lastReply = replies[replies.length - 1];

const renderThread = (
  options: { initialPath?: string; commentId?: string } = {},
) => {
  const data: GetCommentsResponse = { post: op, items: replies };
  return renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <PostWithComments
        data={data}
        pluginId={PLUGIN_ID}
        instanceId={INSTANCE_ID}
        communityId={BOARD_ID}
        commentId={options.commentId}
      />
    </FavoritesContext.Provider>,
    { initialPath: options.initialPath },
  );
};

// setupTest stubs it, since jsdom doesn't implement it.
const scrollIntoView = vi.mocked(window.HTMLElement.prototype.scrollIntoView);

beforeEach(() => {
  scrollIntoView.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("imageboard post anchors", () => {
  it("reads the board's own fragment forms", () => {
    expect(parseImageboardAnchor("q2958486")).toBe(2958486);
    expect(parseImageboardAnchor("#q2958486")).toBe(2958486);
    expect(parseImageboardAnchor("p2958486")).toBe(2958486);
    expect(parseImageboardAnchor("2958486")).toBe(2958486);
    expect(parseImageboardAnchor("")).toBeUndefined();
    expect(parseImageboardAnchor("comments")).toBeUndefined();
    expect(parseImageboardAnchor(undefined)).toBeUndefined();
  });

  it("writes the vichan quote form", () => {
    expect(imageboardPostAnchor(2958486)).toBe("q2958486");
  });
});

describe("linking to an imageboard reply", () => {
  it("renders, marks and scrolls to a reply past the first batch", async () => {
    renderThread({ initialPath: `/#${imageboardPostAnchor(lastReply.number!)}` });

    const body = await screen.findByText("reply body 59");
    const reply = body.closest(`[data-post-number="${lastReply.number}"]`);
    expect(reply?.getAttribute("aria-current")).toBe("location");
    expect(reply?.id).toBe(`q${lastReply.number}`);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(scrollIntoView.mock.contexts[0]).toBe(reply);
  });

  it("marks nothing without a fragment", async () => {
    renderThread();

    await screen.findByText("reply body 0");
    expect(document.querySelector('[aria-current="location"]')).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("gives each reply a link to the thread at that reply", async () => {
    renderThread();

    await screen.findByText("reply body 0");
    const links = screen.getAllByRole("link", { name: "Link to this post" });
    expect(links).toHaveLength(25);
    expect(links[0].getAttribute("href")).toBe(
      `/s/${PLUGIN_ID}/i/${INSTANCE_ID}/c/${BOARD_ID}/post/${THREAD_ID}#q${replies[0].number}`,
    );
  });

  it("treats the comment route as a jump, keeping the whole thread", async () => {
    renderThread({ commentId: String(lastReply.number) });

    const body = await screen.findByText("reply body 59");
    expect(screen.getByText("reply body 0")).toBeDefined();
    expect(
      body
        .closest(`[data-post-number="${lastReply.number}"]`)
        ?.getAttribute("aria-current"),
    ).toBe("location");
  });
});
