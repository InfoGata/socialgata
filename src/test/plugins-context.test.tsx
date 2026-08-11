import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@infogata/shadcn-vite-theme-provider";
import React from "react";
import { store } from "../store/store";
import { PluginsProvider } from "@/contexts/PluginsContext";
import { usePlugins } from "@/hooks/usePlugins";
import { db } from "@/database";
import { PluginInfo } from "@/plugintypes";

const frames = vi.hoisted(() => ({
  created: 0,
  destroyed: 0,
  // The host api the provider hands each frame, so tests can call the same
  // networkRequest a plugin would.
  lastApi: undefined as any,
}));

vi.mock("plugin-frame", () => {
  class PluginFrame {
    hasDefined: Record<string, () => Promise<boolean>>;
    remote: Record<string, () => Promise<unknown>>;

    constructor(api?: any) {
      frames.created++;
      frames.lastApi = api;
      this.hasDefined = new Proxy({}, { get: () => async () => false });
      this.remote = new Proxy({}, { get: () => async () => undefined });
    }
    ready() {
      // A real plugin boots an iframe over the network. Taking at least one
      // macrotask means React commits the intermediate loading state instead of
      // batching it away, which is what makes the spinner observable.
      return new Promise<void>((resolve) => setTimeout(resolve, 5));
    }
    executeCode() {
      return Promise.resolve();
    }
    destroy() {
      frames.destroyed++;
    }
  }
  return { PluginFrame, PluginInterface: {} };
});

const makePlugin = (id: string): PluginInfo => ({
  id,
  name: `Plugin ${id}`,
  script: "// v1",
  version: "1.0.0",
  manifestUrl: `https://example.com/${id}/manifest.json`,
  manifest: { name: `Plugin ${id}`, script: "plugin.js", version: "1.0.0" },
});

// Serves a manifest advertising a newer version than what's installed, so both
// plugins look out of date and the auto-updater picks them up.
const serveNewerVersions = () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const id = url.includes("/a/") ? "a" : "b";
      const body = url.endsWith("manifest.json")
        ? JSON.stringify({
            id,
            name: `Plugin ${id}`,
            script: "plugin.js",
            version: "2.0.0",
          })
        : "// v2";
      return new Response(body, { status: 200 });
    })
  );
};

/** Records every change to pluginsLoaded, which is what drives the spinner. */
const renderProvider = () => {
  const loadedStates: boolean[] = [];

  const Probe: React.FC = () => {
    const { pluginsLoaded } = usePlugins();
    if (loadedStates[loadedStates.length - 1] !== pluginsLoaded) {
      loadedStates.push(pluginsLoaded);
    }
    return null;
  };

  render(
    <Provider store={store}>
      <ThemeProvider defaultTheme="dark">
        <PluginsProvider>
          <Probe />
        </PluginsProvider>
      </ThemeProvider>
    </Provider>
  );

  return loadedStates;
};

describe("PluginsProvider", () => {
  beforeEach(async () => {
    frames.created = 0;
    frames.destroyed = 0;
    await db.plugins.clear();
    await db.plugins.bulkAdd([makePlugin("a"), makePlugin("b")]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the loading state once and never flashes it again while auto-updating", async () => {
    serveNewerVersions();
    const loadedStates = renderProvider();

    // Both plugins get upgraded to 2.0.0 in the database.
    await waitFor(async () => {
      const stored = await db.plugins.toArray();
      expect(stored.map((p) => p.version)).toEqual(["2.0.0", "2.0.0"]);
    });
    // Let any further reloads the provider might kick off settle.
    await new Promise((r) => setTimeout(r, 200));

    // The app is gated on pluginsLoaded, so a second `false` here is a second
    // full-page spinner. It must go false -> true exactly once.
    expect(loadedStates).toEqual([false, true]);
  });

  it("reloads every plugin once for N available updates, not once per update", async () => {
    serveNewerVersions();
    renderProvider();

    await waitFor(async () => {
      const stored = await db.plugins.toArray();
      expect(stored.map((p) => p.version)).toEqual(["2.0.0", "2.0.0"]);
    });

    // 2 frames for the initial load + 2 for a single batched reload. Reloading
    // per updated plugin would build 6.
    await waitFor(() => expect(frames.created).toBe(4));
  });

  it("does not rebuild plugins when no update is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ name: "same", script: "plugin.js", version: "1.0.0" }),
          { status: 200 }
        )
      )
    );

    const loadedStates = renderProvider();

    await waitFor(() => expect(loadedStates).toEqual([false, true]));
    await new Promise((r) => setTimeout(r, 50));

    expect(frames.created).toBe(2);
    expect(loadedStates).toEqual([false, true]);
  });

  /**
   * The host api is what a plugin calls for every request, so these exercise the
   * real provider code rather than the seed helper in isolation.
   */
  describe("the networkRequest handed to plugins", () => {
    const FEED_URL = "https://www.reddit.com/hot.json";

    const extensionResponse = (status: number) => ({
      body: null,
      headers: {},
      status,
      statusText: "",
      url: FEED_URL,
    });

    /** Stands in for the extension, recording what it was asked to fetch. */
    const stubExtension = (
      networkRequest: (
        input: string,
        init?: RequestInit,
        options?: unknown
      ) => Promise<unknown>
    ) => {
      vi.stubGlobal("InfoGata", { networkRequest });
    };

    const hostApi = async () => {
      renderProvider();
      await waitFor(() => expect(frames.lastApi).toBeDefined());
      return frames.lastApi;
    };

    beforeEach(async () => {
      frames.lastApi = undefined;
      // No update available, so the auto-updater stays out of the way.
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          new Response(
            JSON.stringify({ name: "Reddit", script: "plugin.js", version: "1.0.0" }),
            { status: 200 }
          )
        )
      );
      await db.plugins.clear();
      await db.plugins.add({
        ...makePlugin("reddit"),
        manifest: {
          name: "Reddit",
          script: "plugin.js",
          version: "1.0.0",
          siteMatch: ["https://www.reddit.com/*"],
        },
      });
    });

    it("passes the plugin's siteMatch to the extension, which scopes cookies to it", async () => {
      const seen: unknown[] = [];
      stubExtension(async (_input, _init, options) => {
        seen.push(options);
        return extensionResponse(200);
      });

      const api = await hostApi();
      await api.networkRequest(FEED_URL);

      expect(seen).toEqual([
        { siteMatchPatterns: ["https://www.reddit.com/*"] },
      ]);
    });

    it("rejects with an object when the extension request fails", async () => {
      // A bare rejection would break plugin-frame's error serializer and leave
      // the plugin waiting on a promise that never settles.
      stubExtension(async () => {
        throw undefined;
      });

      const api = await hostApi();
      await expect(api.networkRequest(FEED_URL)).rejects.toMatchObject({
        isPluginError: true,
      });
    });
  });
});
