import { afterEach, describe, expect, it, vi } from "vitest";
import { getFileTypeFromPluginUrl, getPlugin } from "@/plugin-utils";

const INSTALLED_FROM =
  "https://cdn.jsdelivr.net/gh/InfoGata/reddit-socialgata@release/manifest.json";

const manifest = (updateUrl?: string) => ({
  id: "2XJix5oj3Xqd",
  name: "Reddit Plugin for SocialGata",
  version: "1.21.0",
  script: "dist/index.js",
  ...(updateUrl ? { updateUrl } : {}),
});

// getFileText derives every file url from the manifest url, so one stub covers
// both the manifest and the script it names.
const serve = (body: object) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("manifest.json")
        ? new Response(JSON.stringify(body))
        : new Response("// plugin script")
    )
  );

afterEach(() => vi.unstubAllGlobals());

describe("where the next update is fetched from", () => {
  it("takes the url the new manifest asks for", async () => {
    // This is what lets a plugin be moved to another host. Without it every
    // installed copy asks its original url forever, and a dead url can never be
    // redirected remotely.
    const moved = "https://example.com/reddit/manifest.json";
    serve(manifest(moved));

    const plugin = await getPlugin(getFileTypeFromPluginUrl(INSTALLED_FROM));

    expect(plugin?.manifestUrl).toBe(moved);
  });

  it("keeps the url it was fetched from when the manifest names none", async () => {
    // The fallback the update paths rely on: a manifest that says nothing about
    // updates must not lose the channel it already had.
    serve(manifest());

    const plugin = await getPlugin(getFileTypeFromPluginUrl(INSTALLED_FROM));

    expect(plugin?.manifestUrl).toBe(INSTALLED_FROM);
  });
});
