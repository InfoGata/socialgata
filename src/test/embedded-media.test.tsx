import { describe, expect, it } from "vitest";
import { fireEvent, within } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import CommentComponent from "@/components/CommentComponent";
import PostBody from "@/components/PostBody";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Post } from "@/plugintypes";

const PLUGIN_ID = "a7f3e9b2c1d4";

const PREVIEW =
  "https://preview.redd.it/fz9n29scvzih1.jpeg?width=960&format=pjpg&auto=webp&s=abc123";
const FULL =
  "https://preview.redd.it/fz9n29scvzih1.jpeg?width=1170&format=pjpg&auto=webp&s=full789";
const GIPHY_WEBP = "https://i.giphy.com/media/3o7aTrs458Hl05XONy/giphy.webp";
const GIPHY_GIF = "https://i.giphy.com/media/3o7aTrs458Hl05XONy/giphy.gif";
const GIPHY_PAGE = "https://giphy.com/gifs/3o7aTrs458Hl05XONy";

/** What the reddit plugin now emits for an uploaded comment image. */
const redditImageBody =
  `<div class="md"><p>lol <img src="${PREVIEW}" alt="image" data-sg-media="image" ` +
  `data-sg-full="${FULL}" width="960" height="1200"></p></div>`;

const giphyBody =
  `<div class="md"><p><img src="${GIPHY_WEBP}" alt="gif" data-sg-media="gif" ` +
  `data-sg-fallback="${GIPHY_GIF}" data-sg-link="${GIPHY_PAGE}"></p></div>`;

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

/**
 * Queries are scoped to each render's own container rather than `screen`.
 * Renders in this suite are left mounted (as in post-body.test.tsx) because
 * unmounting mid-test tears down PluginsProvider while its load is still in
 * flight; scoping keeps them from matching each other.
 */
const renderBody = (body: string) => {
  const { container } = renderWithProviders(
    <PostBody body={body} pluginId={PLUGIN_ID} />,
  );
  return within(container);
};

const renderComment = (body: string) => {
  const comment: Post = {
    apiId: "c1",
    authorName: "someone",
    authorApiId: "someone",
    pluginId: PLUGIN_ID,
    body,
  };
  const { container } = renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <CommentComponent comment={comment} routePluginId={PLUGIN_ID} />
    </FavoritesContext.Provider>,
  );
  return within(container);
};

type Scope = ReturnType<typeof within>;

// RouterProvider mounts asynchronously, so the first query must be awaited.
const image = (scope: Scope) =>
  scope.findByRole("img") as Promise<HTMLImageElement>;

describe("embedded media in bodies", () => {
  it("renders an embedded image lazily and height-capped", async () => {
    const img = await image(renderBody(redditImageBody));
    expect(img.getAttribute("src")).toBe(PREVIEW);
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.className).toContain("max-h-[400px]");
    // Reserves the box so the thread doesn't jump as images load.
    expect(img.getAttribute("width")).toBe("960");
  });

  it("holds the space open until the image loads", async () => {
    const scope = renderBody(redditImageBody);
    const img = await image(scope);
    // Capped height forces width:auto, which leaves an unloaded <img> with no
    // size at all — without this the comment renders as an empty row.
    const wrapper = img.closest("span") as HTMLElement;
    expect(wrapper.style.minHeight).toBe("400px");

    fireEvent.load(img);
    expect(wrapper.style.minHeight).toBe("");
  });

  it("holds space open for an image with no known dimensions", async () => {
    // Giphy embeds arrive with no dimensions at all.
    const scope = renderBody(giphyBody);
    const wrapper = (await image(scope)).closest("span") as HTMLElement;
    expect(wrapper.style.minHeight).toBe("200px");
  });

  it("keeps the surrounding prose in place", async () => {
    const img = await image(renderBody(redditImageBody));
    expect(img.closest("p")?.textContent).toContain("lol");
  });

  it("swaps in the full resolution on click and back again", async () => {
    const scope = renderBody(redditImageBody);
    await image(scope);

    fireEvent.click(scope.getByRole("button", { name: "Expand image" }));
    expect((await image(scope)).getAttribute("src")).toBe(FULL);
    expect((await image(scope)).className).not.toContain("max-h-[400px]");

    fireEvent.click(scope.getByRole("button", { name: "Collapse image" }));
    expect((await image(scope)).getAttribute("src")).toBe(PREVIEW);
    expect((await image(scope)).className).toContain("max-h-[400px]");
  });

  it("falls back webp to gif to the plain link", async () => {
    const scope = renderBody(giphyBody);
    expect((await image(scope)).getAttribute("src")).toBe(GIPHY_WEBP);

    // A giphy url derived from an id can 404; the gif is the second chance.
    fireEvent.error(await image(scope));
    expect((await image(scope)).getAttribute("src")).toBe(GIPHY_GIF);

    fireEvent.error(await image(scope));
    expect(scope.queryByRole("img")).toBeNull();
    const link = (await scope.findByText(GIPHY_PAGE, {
      selector: "a",
    })) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(GIPHY_PAGE);
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("collapses rather than breaking when only the full size fails", async () => {
    const scope = renderBody(redditImageBody);
    await image(scope);
    fireEvent.click(scope.getByRole("button", { name: "Expand image" }));
    fireEvent.error(await image(scope));
    expect((await image(scope)).getAttribute("src")).toBe(PREVIEW);
  });

  it("refuses a data: source, which DOMPurify allows through", async () => {
    const scope = renderBody(
      '<p>subject<img src="data:image/svg+xml,<svg/>" data-sg-media="image"></p>',
    );
    await scope.findByText("subject");
    expect(scope.queryByRole("button", { name: /image/ })).toBeNull();
  });

  it("leaves custom emoji as inline glyphs", async () => {
    const scope = renderBody(
      '<p>subject <img class="emoji" src="https://mastodon.social/e/blob.png" alt=":blob:"></p>',
    );
    await scope.findByText(/subject/);
    // No expand button means it fell through to plain rendering.
    expect(scope.queryByRole("button", { name: "Expand image" })).toBeNull();
  });
});

describe("CommentComponent bodies", () => {
  it("embeds an image in a forum comment", async () => {
    expect((await image(renderComment(redditImageBody))).getAttribute("src")).toBe(
      PREVIEW,
    );
  });

  it("hardens external anchors in comments", async () => {
    // Reddit's own giphy anchors arrive with target=_blank and no rel.
    const scope = renderComment(
      '<div class="md"><p><a href="https://giphy.com/gifs/x" target="_blank">giphy</a></p></div>',
    );
    const link = (await scope.findByText("giphy", {
      selector: "a",
    })) as HTMLAnchorElement;
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("routes an internal plugin link in a comment through the router", async () => {
    const scope = renderComment(
      `<p><a href="/plugins/${PLUGIN_ID}/user/nasa">u/nasa</a></p>`,
    );
    const link = (await scope.findByText("u/nasa", {
      selector: "a",
    })) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(`/plugins/${PLUGIN_ID}/user/nasa`);
  });
});
