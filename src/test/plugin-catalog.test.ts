import { describe, expect, it } from "vitest";
import { isOfferable, needsSignIn } from "@/lib/plugin-catalog";
import { defaultPlugins } from "@/default-plugins";
import type { PluginDescription } from "@/types";

const plain: PluginDescription = { id: "a", name: "Lemmy" };
const needsCors: PluginDescription = {
  id: "b",
  name: "Imageboardish",
  requiresCorsDisabled: true,
};
const needsPageContext: PluginDescription = {
  id: "c",
  name: "Twitterish",
  requiresCorsDisabled: true,
  requiresPageContext: true,
};
const signInInstead: PluginDescription = {
  id: "d",
  name: "Redditish",
  requiresCorsDisabled: true,
  signInReplacesCorsRequirement: true,
};

const WITH_EXTENSION = true;
const PLAIN_BROWSER = false;

describe("which plugins a host is offered", () => {
  it("offers a plugin that needs nothing special, anywhere", () => {
    expect(isOfferable(plain, PLAIN_BROWSER, undefined)).toBe(true);
    expect(isOfferable(plain, WITH_EXTENSION, true)).toBe(true);
  });

  it("hides one that needs the extension when there isn't one", () => {
    expect(isOfferable(needsCors, PLAIN_BROWSER, undefined)).toBe(false);
    expect(isOfferable(needsCors, WITH_EXTENSION, undefined)).toBe(true);
  });

  it("offers one that signing in can substitute for, even in a plain browser", () => {
    // Hiding it would leave the reader unable to install the plugin they need
    // in order to sign in -- the thing that makes it work without an extension.
    expect(isOfferable(signInInstead, PLAIN_BROWSER, undefined)).toBe(true);
  });

  it("still hides one needing page context until that is known to work", () => {
    // Unknown is not yes: offering it early yields a plugin that fails every
    // request.
    expect(isOfferable(needsPageContext, WITH_EXTENSION, undefined)).toBe(false);
    expect(isOfferable(needsPageContext, WITH_EXTENSION, false)).toBe(false);
    expect(isOfferable(needsPageContext, WITH_EXTENSION, true)).toBe(true);
  });

  it("doesn't let signing in excuse a missing page context", () => {
    const both: PluginDescription = {
      ...needsPageContext,
      signInReplacesCorsRequirement: true,
    };

    expect(isOfferable(both, PLAIN_BROWSER, undefined)).toBe(false);
  });
});

describe("when the card warns that an account is needed", () => {
  it("warns only where signing in is what makes the plugin work", () => {
    expect(needsSignIn(signInInstead, PLAIN_BROWSER)).toBe(true);
  });

  it("stays quiet when the extension already covers it", () => {
    expect(needsSignIn(signInInstead, WITH_EXTENSION)).toBe(false);
  });

  it("stays quiet for plugins the flag doesn't apply to", () => {
    expect(needsSignIn(plain, PLAIN_BROWSER)).toBe(false);
    expect(needsSignIn(needsCors, PLAIN_BROWSER)).toBe(false);
  });
});

describe("the real catalog", () => {
  it("offers Reddit in a plain browser, with the sign-in note", () => {
    const reddit = defaultPlugins.find((p) => p.name.startsWith("Reddit"))!;

    expect(isOfferable(reddit, PLAIN_BROWSER, undefined)).toBe(true);
    expect(needsSignIn(reddit, PLAIN_BROWSER)).toBe(true);
  });

  it("keeps hiding Twitter in a plain browser", () => {
    // It reads a source that only answers requests made from its own pages, so
    // no account substitutes for the extension there.
    const twitter = defaultPlugins.find((p) => p.name.startsWith("Twitter"))!;

    expect(isOfferable(twitter, PLAIN_BROWSER, undefined)).toBe(false);
  });
});
