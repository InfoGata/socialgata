import { describe, expect, it } from "vitest";
import { fireEvent, within } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import ForumPost from "@/components/ForumPost";
import MicroblogPost from "@/components/MicroblogPost";
import { FavoritesContext } from "@/sync/FavoritesContext";
import type { FavoritesContextValue } from "@/sync/useFavoritesContext";
import type { FavoritesDoc } from "@/sync/favorites-repo";
import type { Post } from "@/plugintypes";

const PLUGIN_ID = "a7f3e9b2c1d4";
const ID = "dQw4w9WgXcQ";

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
const renderPost = (
  post: Partial<Post>,
  { showFullPost = false, Component = ForumPost } = {},
) => {
  // Shaped like an r/videos link post: the url is the video, the thumbnail is
  // reddit's preview, and nothing marks it as a video.
  const full: Post = {
    apiId: "p1",
    title: "A video worth watching",
    authorName: "someone",
    authorApiId: "someone",
    pluginId: PLUGIN_ID,
    url: `https://www.youtube.com/watch?v=${ID}`,
    thumbnailUrl: "https://external-preview.redd.it/abc.jpg",
    ...post,
  };
  const { container } = renderWithProviders(
    <FavoritesContext.Provider value={favoritesValue}>
      <Component post={full} showFullPost={showFullPost} />
    </FavoritesContext.Provider>,
  );
  // `container` rides along to reach the <iframe>, which has no role.
  return Object.assign(within(container), { container });
};

const iframe = (container: HTMLElement) => container.querySelector("iframe");

describe("YouTube embeds", () => {
  it("shows the player on a post page, without starting it", async () => {
    const scope = renderPost({}, { showFullPost: true });
    await scope.findByRole("button", { name: "Collapse media" });

    const frame = iframe(scope.container)!;
    const src = new URL(frame.getAttribute("src")!);
    expect(src.origin).toBe("https://www.youtube-nocookie.com");
    expect(src.pathname).toBe(`/embed/${ID}`);
    expect(src.searchParams.get("autoplay")).toBeNull();
    // Without this YouTube refuses to play, since index.html sends no Referer.
    expect(frame.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
  });

  it("plays in place from the feed thumbnail, and collapses back", async () => {
    const scope = renderPost({});
    const thumb = await scope.findByRole("button", { name: "video thumbnail" });
    expect(iframe(scope.container)).toBeNull();

    fireEvent.click(thumb);
    const src = new URL(iframe(scope.container)!.getAttribute("src")!);
    expect(src.searchParams.get("autoplay")).toBe("1");

    fireEvent.click(scope.getByRole("button", { name: "Collapse media" }));
    expect(iframe(scope.container)).toBeNull();
  });

  it("falls back to YouTube's own thumbnail when the plugin has none", async () => {
    const scope = renderPost({ thumbnailUrl: undefined });
    const thumb = await scope.findByRole("button", { name: "video thumbnail" });

    expect(within(thumb).getByRole("img").getAttribute("src")).toBe(
      `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`,
    );
  });

  it("prefers the video file when the plugin has one", async () => {
    const scope = renderPost(
      { isVideo: true, videoSources: [{ source: "https://v.redd.it/x/DASH_720.mp4" }] },
      { showFullPost: true },
    );
    await scope.findByRole("button", { name: "Collapse media" });

    expect(scope.container.querySelector("video")).not.toBeNull();
    expect(iframe(scope.container)).toBeNull();
  });

  it("gives a Short a portrait player", async () => {
    const scope = renderPost(
      { url: `https://www.youtube.com/shorts/${ID}` },
      { showFullPost: true },
    );
    await scope.findByRole("button", { name: "Collapse media" });

    expect(iframe(scope.container)!.className).toContain("aspect-9/16");
  });

  it("plays in place in a microblog post too", async () => {
    const scope = renderPost(
      { title: undefined, body: "watch this" },
      { Component: MicroblogPost },
    );
    fireEvent.click(await scope.findByRole("button", { name: "video thumbnail" }));

    expect(iframe(scope.container)).not.toBeNull();
    // The player replaces the preview rather than sitting under it.
    expect(scope.queryByRole("button", { name: "video thumbnail" })).toBeNull();
  });
});

describe("Streamable embeds", () => {
  const url = "https://streamable.com/3fq451";

  it("plays in place from the feed thumbnail", async () => {
    const scope = renderPost({ url });
    fireEvent.click(await scope.findByRole("button", { name: "video thumbnail" }));

    const src = new URL(iframe(scope.container)!.getAttribute("src")!);
    expect(src.origin).toBe("https://streamable.com");
    expect(src.pathname).toBe("/o/3fq451");
    expect(src.searchParams.get("autoplay")).toBe("1");
  });

  it("shows the player on a post page, without starting it", async () => {
    const scope = renderPost({ url }, { showFullPost: true });
    await scope.findByRole("button", { name: "Collapse media" });

    expect(iframe(scope.container)!.getAttribute("src")).toBe("https://streamable.com/o/3fq451");
  });

  it("falls back to Streamable's poster, and to a plain tile if that is missing", async () => {
    const scope = renderPost({ url, thumbnailUrl: undefined });
    const thumb = await scope.findByRole("button", { name: "video thumbnail" });
    const img = within(thumb).getByRole("img");
    expect(img.getAttribute("src")).toBe("https://cdn-cf-east.streamable.com/image/3fq451.jpg");

    fireEvent.error(img);
    const tile = scope.getByRole("button", { name: "video thumbnail" });
    expect(within(tile).queryByRole("img")).toBeNull();
  });
});
