import { describe, expect, it, beforeAll } from "vitest";
import * as linkify from "linkifyjs";
import { registerMentionPlugin } from "@/lib/linkify-mentions";

/**
 * These cases are the ones that broke the stock `linkify-plugin-mention`
 * (`@user@hachyderm.io` split into two tokens and dropped the TLD), so they
 * guard the custom state machine against silent regressions.
 */
describe("fediverse mention tokenizer", () => {
  beforeAll(() => {
    registerMentionPlugin();
  });

  const mentions = (text: string) =>
    linkify
      .tokenize(text)
      .filter((t) => t.t === "fediMention")
      .map((t) => t.toString());

  const types = (text: string) =>
    linkify
      .tokenize(text)
      .filter((t) => t.t !== "text" && t.t !== "nl")
      .map((t) => t.t);

  it("keeps a fediverse handle as a single mention", () => {
    expect(mentions("@user@hachyderm.io hello")).toEqual(["@user@hachyderm.io"]);
    expect(mentions("cc @lemmyuser@lemmy.world thoughts?")).toEqual([
      "@lemmyuser@lemmy.world",
    ]);
  });

  it("handles deep subdomains in a handle", () => {
    expect(mentions("@user@sub.domain.co.uk deep")).toEqual([
      "@user@sub.domain.co.uk",
    ]);
  });

  it("still matches plain local mentions", () => {
    expect(mentions("@DragoCarski plain local mention")).toEqual([
      "@DragoCarski",
    ]);
    expect(mentions("@_underscore @123numeric @UPPER")).toEqual([
      "@_underscore",
      "@123numeric",
      "@UPPER",
    ]);
  });

  it("does not treat an email address as a mention", () => {
    expect(mentions("email me at bob@example.com please")).toEqual([]);
    expect(types("email me at bob@example.com please")).toEqual(["email"]);
  });

  it("excludes trailing punctuation from the handle", () => {
    expect(mentions("trailing punct @user@host.io, ok")).toEqual([
      "@user@host.io",
    ]);
  });

  it("degrades a dangling trailing @ to the bare mention", () => {
    expect(mentions("bare @user@ dangling")).toEqual(["@user"]);
  });

  it("still detects urls and hashtags alongside mentions", () => {
    expect(types("@nasa Our Juno mission science.nasa.gov/x")).toEqual([
      "fediMention",
      "url",
    ]);
  });
});
