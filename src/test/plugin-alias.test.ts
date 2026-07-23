import { describe, expect, it, beforeEach } from "vitest";
import {
  aliasForId,
  aliasFromName,
  assignAlias,
  normalizeAlias,
  resolvePluginParam,
  setPluginAliases,
  validateAlias,
} from "@/lib/plugin-alias";
import { toContentPath } from "@/lib/plugin-route";

describe("normalizeAlias", () => {
  it("slugifies plugin names", () => {
    expect(normalizeAlias("Reddit Plugin for SocialGata")).toBe(
      "reddit-plugin-for-socialgata"
    );
    expect(normalizeAlias("  Hacker_News  ")).toBe("hacker-news");
    expect(normalizeAlias("4chan!!")).toBe("4chan");
  });

  it("never produces a leading or trailing dash", () => {
    expect(normalizeAlias("--reddit--")).toBe("reddit");
    expect(normalizeAlias("!!!")).toBe("");
    // Clamping must not leave the dash the cut lands on.
    expect(normalizeAlias(`${"a".repeat(31)}-bcdef`)).toBe("a".repeat(31));
  });
});

describe("aliasFromName", () => {
  it("drops the boilerplate plugins are named with", () => {
    expect(aliasFromName("Hacker News Plugin for SocialGata")).toBe(
      "hacker-news"
    );
    expect(aliasFromName("Dropbox Sync Plugin for SocialGata")).toBe(
      "dropbox-sync"
    );
    expect(aliasFromName("Reddit")).toBe("reddit");
  });

  it("keeps the whole name when cutting would leave nothing", () => {
    expect(aliasFromName("Plugin for SocialGata")).toBe(
      "plugin-for-socialgata"
    );
  });
});

describe("validateAlias", () => {
  const plugins = [
    { id: "abc123", alias: "reddit" },
    { id: "lemmy-id", alias: "lemmy" },
  ];

  it("accepts a free, normalized alias", () => {
    expect(validateAlias("bluesky", plugins)).toBeNull();
  });

  it("rejects unnormalized input", () => {
    expect(validateAlias("Reddit Two", plugins)).toBe("invalid");
  });

  it("rejects one character aliases", () => {
    expect(validateAlias("r", plugins)).toBe("tooShort");
  });

  it("rejects an alias that is some plugin's id", () => {
    expect(validateAlias("abc123", plugins)).toBe("isPluginId");
  });

  it("rejects an alias another plugin holds", () => {
    expect(validateAlias("reddit", plugins)).toBe("taken");
  });

  it("allows a plugin to keep its own alias", () => {
    expect(validateAlias("reddit", plugins, "abc123")).toBeNull();
  });
});

describe("assignAlias", () => {
  it("hands out the requested alias when free", () => {
    expect(assignAlias("reddit", [])).toBe("reddit");
  });

  it("suffixes rather than failing when taken", () => {
    const plugins = [{ id: "a", alias: "reddit" }];
    expect(assignAlias("reddit", plugins)).toBe("reddit-2");

    plugins.push({ id: "b", alias: "reddit-2" });
    expect(assignAlias("reddit", plugins)).toBe("reddit-3");
  });

  it("derives one from a plugin name", () => {
    expect(assignAlias("Bluesky Plugin", [])).toBe("bluesky-plugin");
  });

  it("gives up when nothing usable is left", () => {
    expect(assignAlias("!", [])).toBeUndefined();
  });
});

describe("the alias registry", () => {
  beforeEach(() => {
    setPluginAliases([
      { id: "reddit-plugin-id", alias: "reddit" },
      { id: "old-reddit-id", alias: "reddit-2" },
      { id: "no-alias-id" },
    ]);
  });

  it("resolves an alias to its plugin id", () => {
    expect(resolvePluginParam("reddit")).toBe("reddit-plugin-id");
    expect(resolvePluginParam("reddit-2")).toBe("old-reddit-id");
  });

  it("passes plugin ids through, so old urls keep working", () => {
    expect(resolvePluginParam("no-alias-id")).toBe("no-alias-id");
    expect(resolvePluginParam("reddit-plugin-id")).toBe("reddit-plugin-id");
  });

  it("passes unknown segments through for notFound to handle", () => {
    expect(resolvePluginParam("mastodon")).toBe("mastodon");
  });

  it("falls back to the base alias when a shared url deduped elsewhere", () => {
    setPluginAliases([{ id: "only-one", alias: "reddit-2" }]);
    // Shared as `/s/reddit/...` by someone whose install got the plain name.
    expect(resolvePluginParam("reddit")).toBe("only-one");
  });

  it("prefers the lowest suffix among base alias matches", () => {
    setPluginAliases([
      { id: "tenth", alias: "reddit-10" },
      { id: "second", alias: "reddit-2" },
    ]);
    expect(resolvePluginParam("reddit")).toBe("second");
  });

  it("maps ids back to aliases, unchanged when there is none", () => {
    expect(aliasForId("reddit-plugin-id")).toBe("reddit");
    expect(aliasForId("no-alias-id")).toBe("no-alias-id");
    // Keeps stringify a fixed point for values already in url form.
    expect(aliasForId("reddit")).toBe("reddit");
  });
});

describe("toContentPath", () => {
  beforeEach(() => {
    setPluginAliases([{ id: "reddit-plugin-id", alias: "reddit" }]);
  });

  it("rewrites old plugin urls to the canonical short form", () => {
    expect(toContentPath("reddit-plugin-id", ["feed"])).toBe("/s/reddit/feed");
    expect(toContentPath("reddit-plugin-id", ["community", "linux"])).toBe(
      "/s/reddit/c/linux"
    );
    expect(
      toContentPath("reddit-plugin-id", [
        "instances",
        "lemmy.ml",
        "community",
        "linux",
      ])
    ).toBe("/s/reddit/i/lemmy.ml/c/linux");
  });

  it("keeps segments that only look like route names", () => {
    // A community actually named "community" or "instances".
    expect(toContentPath("reddit-plugin-id", ["community", "community"])).toBe(
      "/s/reddit/c/community"
    );
    expect(toContentPath("reddit-plugin-id", ["user", "instances"])).toBe(
      "/s/reddit/user/instances"
    );
  });

  it("leaves an unknown plugin segment alone", () => {
    expect(toContentPath("unknown-id", ["feed"])).toBe("/s/unknown-id/feed");
  });
});
