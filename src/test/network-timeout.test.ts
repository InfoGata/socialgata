import { describe, it, expect, vi, afterEach } from "vitest";
import { safeRequestUrl, withTimeout } from "@/lib/network-timeout";

const URL_WITH_QUERY = "https://www.reddit.com/hot.json?q=secret&raw_json=1";

describe("withTimeout", () => {
  afterEach(() => vi.useRealTimers());

  it("rejects with a plugin error rather than a bare value", async () => {
    // A non-object rejection would break plugin-frame's error serializer and
    // strand the plugin, so the shape here matters as much as the timing.
    vi.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 1000, URL_WITH_QUERY);
    const assertion = expect(pending).rejects.toMatchObject({
      isPluginError: true,
      code: "network-error",
      requestUrl: "https://www.reddit.com/hot.json",
    });
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("resolves untouched when the request wins", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 1000, URL_WITH_QUERY))
      .resolves.toBe("ok");
  });
});

describe("safeRequestUrl", () => {
  it("keeps the path but drops the query", () => {
    expect(safeRequestUrl(URL_WITH_QUERY)).toBe(
      "https://www.reddit.com/hot.json"
    );
    expect(safeRequestUrl("not a url")).toBeUndefined();
  });
});
