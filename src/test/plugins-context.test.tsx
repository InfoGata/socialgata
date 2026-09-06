import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@infogata/shadcn-vite-theme-provider";
import React from "react";
import { store } from "../store/store";
import { ExtensionProvider } from "@/contexts/ExtensionContext";
import { PluginsProvider } from "@/contexts/PluginsContext";
import { usePlugins } from "@/hooks/usePlugins";
import { db } from "@/database";
import { PluginInfo } from "@/plugintypes";

const frames = vi.hoisted(() => ({
  created: 0,
  destroyed: 0,
  // ready() calls that have not resolved yet. The load awaits one per plugin
  // and only microtasks separate them, so a non-zero count means a load is
  // still running -- which is what settleFrames waits out.
  booting: 0,
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
      frames.booting++;
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          frames.booting--;
          resolve();
        }, 5)
      );
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
    }),
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
        <ExtensionProvider>
          <PluginsProvider>
            <Probe />
          </PluginsProvider>
        </ExtensionProvider>
      </ThemeProvider>
    </Provider>,
  );

  return loadedStates;
};

/**
 * Waits for a load abandoned by unmounting to run itself out.
 *
 * Unmounting does not stop a load in flight; it keeps going, and only when it
 * finishes does it notice it has been superseded and drop what it built. Left
 * to run into the next test those frames land after beforeEach has zeroed the
 * counters, so a test sees frames it never asked for -- which is how the
 * in-flight cleanup test came to read 4 created against 2 destroyed, the extra
 * pair belonging to the test before it.
 *
 * The wait keys on ready() calls outstanding rather than on the counters
 * holding still for a while. The load awaits one ready() per plugin with only
 * microtasks in between, so "none outstanding" across a macrotask boundary
 * means the load is genuinely done -- true however long a frame takes to boot,
 * where a fixed quiet window is only ever longer than the gaps it has been
 * tuned against and goes back to guessing under load.
 *
 * It deliberately does not wait for the counters to match: a load that
 * published its frames leaves them alive on unmount by design, since frames are
 * torn down when a plugin is removed or reloaded, not when the provider goes.
 */
const settleFrames = async (timeoutMs = 5000) => {
  const macrotask = () => new Promise((r) => setTimeout(r, 0));
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await macrotask();
    if (frames.booting > 0) continue;
    // Nothing booting can still be a load between two frames, so give the loop
    // a turn to start the next one before calling it finished.
    const created = frames.created;
    await macrotask();
    if (frames.booting === 0 && frames.created === created) return;
  }
  throw new Error(
    `Frames never settled: ${frames.booting} still booting, ` +
      `${frames.created} created, ${frames.destroyed} destroyed. ` +
      `A load that outlives this is a leak, not a slow test.`
  );
};

describe("PluginsProvider", () => {
  beforeEach(async () => {
    frames.created = 0;
    frames.destroyed = 0;
    await db.plugins.clear();
    await db.plugins.bulkAdd([makePlugin("a"), makePlugin("b")]);
  });

  afterEach(async () => {
    cleanup();
    await settleFrames();
    // Only once the abandoned load is done with it: it fetches manifests, and
    // restoring the real fetch under a running load sends it at the network.
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

  it("cleans up a load still in flight when the provider unmounts", async () => {
    renderProvider();
    // Each frame's ready() takes a macrotask, so the initial load is still
    // running here — this is the window the app never hits but tests do.
    await new Promise((r) => setTimeout(r, 1));
    cleanup();

    // Let the abandoned load run to completion, however long its frames take.
    await settleFrames();

    expect(frames.created).toBeGreaterThan(0);
    // Nothing can reach these frames once the provider is gone, so the load has
    // to tear down what it built rather than publishing it into a dead tree
    // (which also meant setting state on an unmounted component).
    expect(frames.destroyed).toBe(frames.created);
  });

  it("does not rebuild plugins when no update is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              name: "same",
              script: "plugin.js",
              version: "1.0.0",
            }),
            { status: 200 },
          ),
      ),
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
        options?: unknown,
      ) => Promise<unknown>,
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
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                name: "Reddit",
                script: "plugin.js",
                version: "1.0.0",
              }),
              { status: 200 },
            ),
        ),
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
