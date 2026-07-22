import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "./renderWithProviders";
import PostBody from "@/components/PostBody";
import { acctFromMentionHref } from "@/lib/post-body-links";

const PLUGIN_ID = "a7f3e9b2c1d4";

// RouterProvider mounts asynchronously, so anchors must be awaited.
const anchor = (text: string) =>
  screen.findByText(text, { selector: "a" }) as Promise<HTMLAnchorElement>;

describe("acctFromMentionHref", () => {
  it("combines the handle with the instance host", () => {
    expect(acctFromMentionHref("https://hachyderm.io/@user")).toBe(
      "user@hachyderm.io",
    );
    expect(acctFromMentionHref("https://mastodon.social/@nasa/")).toBe(
      "nasa@mastodon.social",
    );
  });

  it("keeps an acct that already carries its host", () => {
    expect(acctFromMentionHref("https://mastodon.social/@user@other.tld")).toBe(
      "user@other.tld",
    );
  });

  it("returns undefined for non-profile urls", () => {
    expect(acctFromMentionHref("https://example.com/posts/1")).toBeUndefined();
    expect(acctFromMentionHref("not a url")).toBeUndefined();
  });
});

describe("PostBody", () => {
  it("links a bare mention to the plugin user route", async () => {
    renderWithProviders(<PostBody body="hi @nasa" pluginId={PLUGIN_ID} />);
    expect((await anchor("@nasa")).getAttribute("href")).toBe(
      `/plugins/${PLUGIN_ID}/user/nasa`,
    );
  });

  it("links a fediverse handle as a single mention", async () => {
    renderWithProviders(
      <PostBody body="cc @user@hachyderm.io" pluginId={PLUGIN_ID} />,
    );
    expect((await anchor("@user@hachyderm.io")).getAttribute("href")).toBe(
      `/plugins/${PLUGIN_ID}/user/user%40hachyderm.io`,
    );
  });

  it("routes an already-anchored mastodon mention internally", async () => {
    renderWithProviders(
      <PostBody
        body='<p><a href="https://hachyderm.io/@user" class="u-url mention">@user</a></p>'
        pluginId={PLUGIN_ID}
      />,
    );
    expect((await anchor("@user")).getAttribute("href")).toBe(
      `/plugins/${PLUGIN_ID}/user/user%40hachyderm.io`,
    );
  });

  it("links hashtags to the trending route", async () => {
    renderWithProviders(<PostBody body="look #Space" pluginId={PLUGIN_ID} />);
    expect((await anchor("#Space")).getAttribute("href")).toBe(
      `/plugins/${PLUGIN_ID}/trending/Space`,
    );
  });

  it("hardens external links and leaves them external", async () => {
    renderWithProviders(
      <PostBody body="see https://t.co/abc" pluginId={PLUGIN_ID} />,
    );
    const link = await anchor("https://t.co/abc");
    expect(link.getAttribute("href")).toBe("https://t.co/abc");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("does not linkify an email address as a mention", async () => {
    renderWithProviders(
      <PostBody body="mail bob@example.com" pluginId={PLUGIN_ID} />,
    );
    expect((await anchor("bob@example.com")).getAttribute("href")).toBe(
      "mailto:bob@example.com",
    );
  });

  it("strips dangerous markup before linkifying", async () => {
    renderWithProviders(
      <PostBody
        body={'<img src=x onerror="alert(1)"><script>alert(1)</script>@nasa'}
        pluginId={PLUGIN_ID}
      />,
    );
    // The mention still renders, proving sanitize ran before linkify.
    const link = await anchor("@nasa");
    const root = link.closest("div") as HTMLElement;
    expect(root.innerHTML).not.toContain("onerror");
    expect(root.innerHTML).not.toContain("<script");
  });
});
