import { describe, it, expect, afterEach, vi } from "vitest";
import {
  filterValidRedirects,
  isValidRedirectPattern,
} from "@/redirect-validation";

type Global = typeof globalThis & { URLPattern?: unknown };

/**
 * jsdom has no URLPattern, so stand in for the browser's. Chrome rejects
 * negated character classes inside a custom regex group (e.g. `[^/?#]+`), which
 * is the case that matters here.
 */
const stubURLPattern = () => {
  (globalThis as Global).URLPattern = class {
    constructor(pattern: string) {
      if (/\[\^/.test(pattern)) {
        throw new TypeError(
          `Failed to construct 'URLPattern': Custom regular expression group is invalid.`
        );
      }
    }
  };
};

afterEach(() => {
  delete (globalThis as Global).URLPattern;
  vi.restoreAllMocks();
});

describe("isValidRedirectPattern", () => {
  it("accepts patterns the browser can compile", () => {
    stubURLPattern();
    expect(
      isValidRedirectPattern("https://x.com/:userId([a-zA-Z0-9_]+)")
    ).toBe(true);
  });

  it("rejects patterns the browser cannot compile", () => {
    stubURLPattern();
    expect(isValidRedirectPattern("https://x.com/:userId([^/?#]+)")).toBe(
      false
    );
  });

  it("assumes valid when URLPattern is unavailable", () => {
    expect(isValidRedirectPattern("https://x.com/:userId([^/?#]+)")).toBe(true);
  });
});

describe("filterValidRedirects", () => {
  it("drops invalid redirects and keeps the rest", () => {
    stubURLPattern();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const valid = {
      pattern: "https://x.com/:userId([a-zA-Z0-9_]+)",
      path: "/user/:userId",
    };
    const invalid = {
      pattern: "https://x.com/:userId([^/?#]+)",
      path: "/user/:userId",
    };

    const result = filterValidRedirects([invalid, valid], {
      id: "abc",
      name: "Twitter",
    });

    expect(result).toEqual([valid]);
  });

  it("warns once per invalid pattern, not once per registration", () => {
    stubURLPattern();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const plugin = { id: "abc", name: "Twitter" };
    // Unique to this test: the warn-once cache is module-level and persists.
    const redirects = [
      { pattern: "https://x.com/:a([^/]+)", path: "/user/:a" },
    ];

    filterValidRedirects(redirects, plugin);
    filterValidRedirects(redirects, plugin);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("https://x.com/:a([^/]+)");
    expect(warn.mock.calls[0][0]).toContain("Twitter");
  });
});
