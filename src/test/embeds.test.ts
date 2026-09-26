import { describe, expect, it } from "vitest";
import { getYouTubeEmbed, youTubeEmbedSrc } from "@/lib/embeds";

const ID = "dQw4w9WgXcQ";

describe("getYouTubeEmbed", () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?feature=share&v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}&list=RDAMVM`,
    `http://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc123`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube.com/v/${ID}`,
  ])("finds the video in %s", (url) => {
    expect(getYouTubeEmbed(url)).toEqual({ id: ID, isShort: false });
  });

  it("marks a Short as portrait", () => {
    expect(getYouTubeEmbed(`https://www.youtube.com/shorts/${ID}`)).toEqual({
      id: ID,
      isShort: true,
    });
  });

  it.each([
    ["90", 90],
    ["90s", 90],
    ["1m30s", 90],
    ["1h2m3s", 3723],
    ["2m", 120],
  ])("reads t=%s as %i seconds", (t, seconds) => {
    expect(getYouTubeEmbed(`https://youtu.be/${ID}?t=${t}`)?.start).toBe(seconds);
  });

  it("reads start= as well as t=", () => {
    expect(getYouTubeEmbed(`https://www.youtube.com/embed/${ID}?start=42`)?.start).toBe(42);
  });

  it("ignores a start time it can't read", () => {
    expect(getYouTubeEmbed(`https://youtu.be/${ID}?t=soon`)).toEqual({ id: ID, isShort: false });
  });

  it.each([
    undefined,
    "",
    "not a url",
    `https://vimeo.com/watch?v=${ID}`,
    `https://notyoutube.com/watch?v=${ID}`,
    `https://youtube.com.evil.example/watch?v=${ID}`,
    "https://www.youtube.com/watch?v=short",
    `https://www.youtube.com/watch?v=${ID}x`,
    "https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw",
    "https://www.youtube.com/@somechannel",
    "https://www.youtube.com/playlist?list=PL123",
    `javascript:alert(1)//youtu.be/${ID}`,
  ])("rejects %s", (url) => {
    expect(getYouTubeEmbed(url)).toBeUndefined();
  });
});

describe("youTubeEmbedSrc", () => {
  it("uses the no-cookie host", () => {
    const src = new URL(youTubeEmbedSrc({ id: ID, isShort: false }));
    expect(src.origin).toBe("https://www.youtube-nocookie.com");
    expect(src.pathname).toBe(`/embed/${ID}`);
    expect(src.searchParams.get("autoplay")).toBeNull();
  });

  it("carries the start time and autoplay", () => {
    const src = new URL(youTubeEmbedSrc({ id: ID, isShort: false, start: 90 }, { autoplay: true }));
    expect(src.searchParams.get("start")).toBe("90");
    expect(src.searchParams.get("autoplay")).toBe("1");
  });
});
