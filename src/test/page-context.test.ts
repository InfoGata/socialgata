import { describe, expect, it } from "vitest";
import { needsPageContext, pageContextPatternHost } from "@/lib/page-context";

describe("pageContextPatternHost", () => {
  it("pins a pattern with a concrete host", () => {
    expect(pageContextPatternHost("https://twstalker.com/*")).toBe(
      "twstalker.com"
    );
  });

  it("refuses a wildcard host, which would nominate every site", () => {
    expect(pageContextPatternHost("https://*/*")).toBeUndefined();
    expect(pageContextPatternHost("https://*.com/*")).toBeUndefined();
    expect(pageContextPatternHost("https://*.twstalker.com/*")).toBeUndefined();
  });

  it("refuses non-http protocols", () => {
    expect(pageContextPatternHost("file:///etc/*")).toBeUndefined();
  });
});

describe("needsPageContext", () => {
  const patterns = ["https://twstalker.com/*"];

  it("matches a url on the declared host", () => {
    expect(needsPageContext("https://twstalker.com/elonmusk", patterns)).toBe(
      true
    );
  });

  it("ignores urls on other hosts", () => {
    expect(needsPageContext("https://example.com/elonmusk", patterns)).toBe(
      false
    );
  });

  it("does not let a lookalike host borrow the pattern", () => {
    expect(
      needsPageContext("https://twstalker.com.evil.test/x", patterns)
    ).toBe(false);
  });

  it("is false when the plugin declared nothing", () => {
    expect(needsPageContext("https://twstalker.com/x", undefined)).toBe(false);
    expect(needsPageContext("https://twstalker.com/x", [])).toBe(false);
  });

  it("ignores a wildcard-host pattern even if the url matches it", () => {
    expect(needsPageContext("https://twstalker.com/x", ["https://*/*"])).toBe(
      false
    );
  });
});
