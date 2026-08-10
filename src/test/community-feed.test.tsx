import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import CommunityFeed from "@/components/CommunityFeed";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Community } from "@/plugintypes";

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

const renderFeed = (props: { apiId?: string; community?: Community }) =>
  renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <CommunityFeed posts={[]} pluginId={PLUGIN_ID} {...props} />
    </FavoritesContext.Provider>,
  );

// Vitest globals are off, so testing-library's automatic cleanup isn't wired up.
afterEach(cleanup);

describe("CommunityFeed", () => {
  it("shows a favorite button for plugins that return no community", async () => {
    renderFeed({ apiId: "zwift" });

    expect(await screen.findByText("zwift")).toBeDefined();
    expect(screen.getByLabelText("Add to favorites")).toBeDefined();
  });

  it("prefers the community the plugin returned", async () => {
    renderFeed({
      apiId: "zwift",
      community: { apiId: "zwift", name: "r/zwift", description: "Indoor cycling" },
    });

    expect(await screen.findByText("r/zwift")).toBeDefined();
    expect(screen.getByText("Indoor cycling")).toBeDefined();
  });

  it("renders no header when the community is unknown", () => {
    renderFeed({});

    expect(screen.queryByLabelText("Add to favorites")).toBeNull();
  });
});
