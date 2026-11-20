import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./renderWithProviders";
import PostWithComments from "@/components/PostWithComments";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { GetCommentsResponse, Post } from "@/plugintypes";
import { quotedNumbers } from "@/contexts/ImageboardPostsContext";

const PLUGIN_ID = "IB4ch4nPl9n";
const INSTANCE_ID = "leftypol";
const BOARD_ID = "leftypol";
const THREAD = 2005272;

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

/** A quote link exactly as the imageboard plugin writes one. */
const quote = (n: number, thread = THREAD, board = BOARD_ID) =>
  `<a href="#" data-thread-id="${thread}" data-board-id="${board}" class="text-primary hover:underline">&gt;&gt;${n}</a>`;

const post = (number: number, body: string): Post => ({
  apiId: String(number),
  number,
  body,
  pluginId: PLUGIN_ID,
  instanceId: INSTANCE_ID,
  communityApiId: BOARD_ID,
});

const op = { ...post(THREAD, "the op"), title: "Thread title" };
const replies: Post[] = [
  post(101, `${quote(THREAD)}<br>first reply`),
  post(102, `${quote(THREAD)} ${quote(101)} ${quote(101)}<br>second reply`),
  // Quotes of another thread, a post that isn't here, and itself: none count.
  post(103, `${quote(101, 999)} ${quote(555)} ${quote(103)}<br>third reply`),
  post(104, `${quote(102)}<br>fourth reply`),
];

const renderThread = () => {
  const data: GetCommentsResponse = { post: op, items: replies };
  return renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <PostWithComments
        data={data}
        pluginId={PLUGIN_ID}
        instanceId={INSTANCE_ID}
        communityId={BOARD_ID}
      />
    </FavoritesContext.Provider>,
  );
};

const backlinksOf = (number: number) =>
  screen.queryByLabelText(`Replies to post ${number}`);

/** Open hover cards, outermost first. Radix gives them no role. */
const openCards = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>("[data-radix-popper-content-wrapper]"),
  );

const linkTexts = (el: HTMLElement | null) =>
  el ? within(el).getAllByRole("link").map((a) => a.textContent) : [];

afterEach(() => {
  cleanup();
});

describe("quotedNumbers", () => {
  const thread = { number: THREAD, boardId: BOARD_ID };

  it("reads same-thread quotes once each", () => {
    expect(quotedNumbers(`${quote(1)} ${quote(2)} ${quote(1)}`, thread)).toEqual([1, 2]);
  });

  it("skips quotes of another thread or board", () => {
    expect(quotedNumbers(quote(1, 999), thread)).toEqual([]);
    expect(quotedNumbers(quote(1, THREAD, "b"), thread)).toEqual([]);
  });

  it("takes a quote without a thread to be in this thread", () => {
    expect(quotedNumbers('<a href="#">&gt;&gt;7</a>', thread)).toEqual([7]);
  });

  it("ignores ordinary links and quote text", () => {
    expect(
      quotedNumbers(
        '<a href="https://example.com">&gt;&gt;7</a> <span>&gt;&gt;8</span>',
        thread,
      ),
    ).toEqual([]);
  });
});

describe("imageboard backlinks", () => {
  it("lists each post's replies in thread order", async () => {
    renderThread();
    await screen.findByText(/fourth reply/);

    expect(linkTexts(backlinksOf(THREAD))).toEqual([">>101", ">>102"]);
    expect(linkTexts(backlinksOf(101))).toEqual([">>102"]);
    expect(linkTexts(backlinksOf(102))).toEqual([">>104"]);
    // Nobody quotes these; 103's quotes all point elsewhere.
    expect(backlinksOf(103)).toBeNull();
    expect(backlinksOf(104)).toBeNull();
  });

  it("previews a backlink, and the quote inside that preview", async () => {
    const user = userEvent.setup();
    renderThread();
    await screen.findByText(/fourth reply/);

    // 101's backlink to 102 previews 102...
    await user.hover(within(backlinksOf(101)!).getByRole("link", { name: ">>102" }));
    await waitFor(() => expect(openCards()).toHaveLength(1));
    const first = openCards()[0];
    expect(within(first).getByText(/second reply/)).toBeDefined();

    // ...whose own backlink to 104 is a live quote link that previews again.
    await user.hover(
      within(within(first).getByLabelText("Replies to post 102")).getByRole("link", {
        name: ">>104",
      }),
    );
    // The first card stays open beneath it.
    await waitFor(() => expect(openCards()).toHaveLength(2));
    expect(within(openCards()[0]).getByText(/second reply/)).toBeDefined();
    expect(within(openCards()[1]).getByText(/fourth reply/)).toBeDefined();
  });
});
