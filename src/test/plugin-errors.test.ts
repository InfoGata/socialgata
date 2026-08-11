import { describe, it, expect } from "vitest";
import {
  createPluginError,
  errorSiteHost,
  isPluginErrorPayload,
  toPluginErrorPayload,
} from "@/plugin-errors";

/**
 * The exact algorithm plugin-frame uses to send an error across the iframe
 * boundary (node_modules/plugin-frame/dist/child.js). Reproduced rather than
 * imported so this test pins the behaviour the convention depends on.
 */
const serializeError = (e: any) =>
  [...Object.keys(e), "message"].reduce((t: any, s) => ((t[s] = e[s]), t), {});

describe("plugin error payloads", () => {
  it("survives plugin-frame's serialization", () => {
    const serialized = serializeError(
      createPluginError({
        code: "blocked",
        message: "Reddit refused the request (403).",
        status: 403,
        requestUrl: "https://www.reddit.com/hot.json",
      })
    );

    // What the app actually receives is a plain object, so the fields it
    // classifies on have to be own and enumerable.
    expect(serialized).toMatchObject({
      isPluginError: true,
      code: "blocked",
      status: 403,
      requestUrl: "https://www.reddit.com/hot.json",
      message: "Reddit refused the request (403).",
    });
    expect(serialized instanceof Error).toBe(false);
    expect(isPluginErrorPayload(serialized)).toBe(true);
  });

  it("recognizes only own discriminator properties", () => {
    expect(
      isPluginErrorPayload({ isPluginError: true, code: "blocked", message: "" })
    ).toBe(true);
    // Inherited, not own — a shape we should not trust.
    expect(
      isPluginErrorPayload(
        Object.create({ isPluginError: true, code: "blocked" })
      )
    ).toBe(false);
    expect(isPluginErrorPayload({ isPluginError: true })).toBe(false);
    expect(isPluginErrorPayload(new Error("nope"))).toBe(false);
    expect(isPluginErrorPayload(undefined)).toBe(false);
    expect(isPluginErrorPayload("blocked")).toBe(false);
  });

  it("classifies errors from plugins that predate the convention", () => {
    expect(toPluginErrorPayload(new TypeError("Failed to fetch")).code).toBe(
      "network-error"
    );
    expect(
      toPluginErrorPayload(new SyntaxError("Unexpected token '<'")).code
    ).toBe("invalid-response");
    expect(
      toPluginErrorPayload(
        new TypeError("Cannot read properties of undefined (reading 'children')")
      ).code
    ).toBe("invalid-response");
    expect(toPluginErrorPayload(new Error("who knows")).code).toBe("unknown");
  });

  it("never produces an empty message, whatever it is handed", () => {
    for (const value of [undefined, null, "", 42, {}]) {
      const payload = toPluginErrorPayload(value);
      expect(payload.isPluginError).toBe(true);
      expect(payload.message.length).toBeGreaterThan(0);
    }
  });

  it("passes an existing payload through untouched", () => {
    const payload = {
      isPluginError: true as const,
      code: "forbidden" as const,
      message: "private",
      detail: "private",
    };
    expect(toPluginErrorPayload(payload)).toBe(payload);
  });

  it("reads the host from the request url", () => {
    expect(
      errorSiteHost({ requestUrl: "https://www.reddit.com/hot.json" })
    ).toBe("www.reddit.com");
    expect(errorSiteHost({ requestUrl: "not a url" })).toBeUndefined();
    expect(errorSiteHost({})).toBeUndefined();
  });
});
