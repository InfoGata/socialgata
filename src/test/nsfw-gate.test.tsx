import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./renderWithProviders";
import PostComponent from "@/components/PostComponent";
import CommunityFeed from "@/components/CommunityFeed";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Post } from "@/plugintypes";
import { store, uiPersistWhitelist } from "@/store/store";
import {
  initialState,
  setNsfwDisplay,
  type NsfwDisplay,
  type UiState,
} from "@/store/reducers/uiSlice";

afterEach(cleanup);

const PLUGIN_ID = "2XJix5oj3Xqd";

const emptyDoc: FavoritesDoc = {
  instances: {},
  posts: {},
  comments: {},
  communities: {},
  users: {},
};

const favoritesValue = {
  handle: { change: () => {}, doc: () => emptyDoc },
  doc: emptyDoc,
  isReady: true,
} as unknown as FavoritesContextValue;

// pluginId and communityApiId are what PostLink needs to build a route; without
// them the title renders as nothing and every assertion here passes or fails for
// the wrong reason.
const post = (overrides: Partial<Post> = {}): Post => ({
  apiId: "abc123",
  title: "A post that exists",
  pluginId: PLUGIN_ID,
  communityApiId: "somecommunity",
  ...overrides,
});

// The router renders asynchronously, so every test has to wait for something
// before it can assert. Under "hide" the subject renders nothing at all, and
// there'd be nothing to wait for — hence the marker, which is always present
// once the tree is up.
const MARKER = "tree is mounted";

const withFavorites = async (ui: React.ReactElement) => {
  const result = renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <span>{MARKER}</span>
      {ui}
    </FavoritesContext.Provider>
  );
  await screen.findByText(MARKER);
  return result;
};

// The store is a singleton shared by every test in the run, so the preference
// has to be put back or the next file inherits it.
const setDisplay = (display: NsfwDisplay) =>
  store.dispatch(setNsfwDisplay(display));

beforeEach(() => setDisplay(initialState.nsfwDisplay));
afterEach(() => setDisplay(initialState.nsfwDisplay));

describe("adult content preference", () => {
  it("defaults to withholding rather than showing", () => {
    // The default is the whole point of the feature, so it's asserted directly
    // rather than left implied by the tests below.
    expect(initialState.nsfwDisplay).toBe("warn");
  });

  it("persists every ui preference that isn't deliberately ephemeral", () => {
    // A preference missing from the whitelist appears to work until a reload
    // resets it, which is a bug nothing else here would catch.
    const ephemeral: (keyof UiState)[] = ["isNavigationMenuOpen"];
    const expected = (Object.keys(initialState) as (keyof UiState)[])
      .filter((key) => !ephemeral.includes(key))
      .sort();

    expect([...uiPersistWhitelist].sort()).toEqual(expected);
  });
});

describe("NsfwGate on a post", () => {
  it("leaves a post that isn't flagged alone", async () => {
    await withFavorites(<PostComponent post={post()} />);

    expect(await screen.findByText("A post that exists")).toBeInTheDocument();
  });

  it("withholds a flagged post behind a prompt", async () => {
    await withFavorites(<PostComponent post={post({ nsfw: true })} />);

    expect(await screen.findByText("Adult content")).toBeInTheDocument();
    expect(screen.queryByText("A post that exists")).not.toBeInTheDocument();
  });

  it("shows the post once the reader asks for it", async () => {
    await withFavorites(<PostComponent post={post({ nsfw: true })} />);

    await userEvent.click(await screen.findByRole("button", { name: "Show" }));

    expect(await screen.findByText("A post that exists")).toBeInTheDocument();
  });

  it("leaves no trace at all under hide", async () => {
    setDisplay("hide");
    await withFavorites(<PostComponent post={post({ nsfw: true })} />);

    expect(screen.queryByText("A post that exists")).not.toBeInTheDocument();
    // Distinct from "warn": there is nothing to reveal and nothing to see.
    expect(screen.queryByText("Adult content")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show" })).not.toBeInTheDocument();
  });

  it("renders normally under show", async () => {
    setDisplay("show");
    await withFavorites(<PostComponent post={post({ nsfw: true })} />);

    expect(await screen.findByText("A post that exists")).toBeInTheDocument();
  });
});

describe("NsfwGate on a community", () => {
  it("withholds a post in an adult community even when the post isn't flagged", async () => {
    // The imageboard case: the board carries the classification and the replies
    // in it carry nothing, so gating per-post alone would let all of them
    // through.
    await withFavorites(
      <CommunityFeed
        posts={[post()]}
        pluginId={PLUGIN_ID}
        community={{ apiId: "b", name: "Random", nsfw: true }}
      />
    );

    expect((await screen.findAllByText("Adult content")).length).toBeGreaterThan(0);
    expect(screen.queryByText("A post that exists")).not.toBeInTheDocument();
  });

  it("labels the community as adult once its posts are on screen", async () => {
    setDisplay("show");
    await withFavorites(
      <CommunityFeed
        posts={[post()]}
        pluginId={PLUGIN_ID}
        community={{ apiId: "b", name: "Random", nsfw: true }}
      />
    );

    // Nothing is gated under "show", so the badge is the only thing saying
    // what this community is.
    expect(await screen.findByText("NSFW")).toBeInTheDocument();
    expect(screen.getByText("A post that exists")).toBeInTheDocument();
  });
});
