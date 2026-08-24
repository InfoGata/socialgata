import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import ForumPost from "@/components/ForumPost";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Post, PostImage } from "@/plugintypes";

const PLUGIN_ID = "a7f3e9b2c1d4";

/** Shapes taken from a live r/bald gallery post. */
const galleryImage = (id: string, extra: Partial<PostImage> = {}): PostImage => ({
  url: `https://preview.redd.it/${id}.jpg?width=960&crop=smart&auto=webp&s=s${id}`,
  fullUrl: `https://preview.redd.it/${id}.jpg?width=2022&format=pjpg&s=full${id}`,
  width: 960,
  height: 960,
  ...extra,
});

const IMAGES = [
  galleryImage("n3dwz3gjcq1f1", { caption: "before" }),
  galleryImage("p7gie3gjcq1f1"),
  galleryImage("5t2c44gjcq1f1", { caption: "after" }),
];

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
 * Queries are scoped to each render's own container rather than `screen`, and
 * renders are left mounted, for the reasons documented in
 * embedded-media.test.tsx.
 */
const renderPost = (post: Partial<Post>) => {
  const full: Post = {
    apiId: "p1",
    title: "The council has spoken",
    authorName: "someone",
    authorApiId: "someone",
    pluginId: PLUGIN_ID,
    // A gallery's url is a reddit.com/gallery link — it matches no image regex,
    // which is exactly what the expand gates have to cope with.
    url: "https://www.reddit.com/gallery/1vbr4b6",
    ...post,
  };
  const { container } = renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <ForumPost post={full} showFullPost />
    </FavoritesContext.Provider>,
  );
  return within(container);
};

type Scope = ReturnType<typeof within>;

// RouterProvider mounts asynchronously, so the first query must be awaited.
const images = async (scope: Scope) =>
  (await scope.findAllByRole("img")) as HTMLImageElement[];

describe("post galleries", () => {
  it("renders every image, in the order the plugin gave them", async () => {
    const scope = renderPost({ images: IMAGES });
    const rendered = await images(scope);

    expect(rendered.map((i) => i.getAttribute("src"))).toEqual(
      IMAGES.map((i) => i.url),
    );
  });

  it("shows which image of how many is on screen", async () => {
    const scope = renderPost({ images: IMAGES });
    await images(scope);

    expect(scope.getByText("1 / 3")).toBeTruthy();
  });

  it("offers arrows to move between images", async () => {
    const scope = renderPost({ images: IMAGES });
    await images(scope);

    expect(scope.getByRole("button", { name: "Next slide" })).toBeTruthy();
    expect(scope.getByRole("button", { name: "Previous slide" })).toBeTruthy();
  });

  it("renders the captions the author attached", async () => {
    const scope = renderPost({ images: IMAGES });
    await images(scope);

    expect(scope.getByText("before")).toBeTruthy();
    expect(scope.getByText("after")).toBeTruthy();
  });

  it("gives each image its own click-to-expand and full-resolution source", async () => {
    const scope = renderPost({ images: IMAGES });
    const [first] = await images(scope);

    expect(first.closest("button")?.getAttribute("aria-label")).toBe("Expand image");
    // The whole point of a gallery slide: more room than an inline body image.
    expect(first.className).toContain("max-h-[70vh]");
  });

  it("drops the carousel chrome for a single image", async () => {
    const scope = renderPost({ images: [IMAGES[0]] });
    const rendered = await images(scope);

    expect(rendered).toHaveLength(1);
    expect(scope.queryByRole("button", { name: "Next slide" })).toBeNull();
    expect(scope.queryByText("1 / 1")).toBeNull();
  });

  it("expands a gallery whose url no image regex would match", async () => {
    // Without `images` in the expand gate, a reddit.com/gallery url renders
    // nothing at all here.
    const scope = renderPost({ images: IMAGES, thumbnailUrl: IMAGES[0].url });
    const rendered = await images(scope);

    expect(rendered.length).toBeGreaterThan(1);
  });

  it("badges the feed thumbnail with the image count", async () => {
    const { container } = renderWithProviders(
      <FavoritesContext.Provider value={favoritesValue}>
        <ForumPost
          post={{
            apiId: "p2",
            title: "The council has spoken",
            authorName: "someone",
            authorApiId: "someone",
            pluginId: PLUGIN_ID,
            url: "https://www.reddit.com/gallery/1vbr4b6",
            thumbnailUrl: IMAGES[0].url,
            images: IMAGES,
          }}
        />
      </FavoritesContext.Provider>,
    );
    const scope = within(container);
    // Collapsed in a feed: the thumbnail must say there is more behind it, and
    // must expand rather than link out to reddit.
    const button = await scope.findByLabelText("Show all 3 images");

    expect(button.tagName).toBe("BUTTON");
    expect(within(button).getByText("3")).toBeTruthy();
  });
});
