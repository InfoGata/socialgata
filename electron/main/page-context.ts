import { BrowserWindow } from "electron";

/**
 * Some sites answer a request differently depending on where it came from, and
 * no amount of header setting changes that. twstalker.com is the case that
 * forced this: Cloudflare there keys on `Sec-Fetch-Site`, so a request from the
 * app's own renderer arrives as `cross-site` and is challenged, while the very
 * same request issued from a page on twstalker.com arrives as `same-origin` and
 * is served. `Sec-Fetch-*` is browser-controlled, and forcing it through
 * `onBeforeSendHeaders` does land the header but does not satisfy Cloudflare —
 * it validates the real context, not the claim.
 *
 * So the only way to make such a request is to genuinely be a page on that site.
 * This keeps a hidden window parked on the origin and runs the fetch inside it.
 */

/** How long to let a bot check resolve before giving up on the window. */
const CHALLENGE_TIMEOUT_MS = 90_000;
const CHALLENGE_POLL_MS = 500;

/** A parked window is cheap to keep but not free; drop it once it goes unused. */
const IDLE_CLOSE_MS = 5 * 60_000;

type ParkedWindow = {
  window: BrowserWindow;
  idleTimer?: NodeJS.Timeout;
};

const windows = new Map<string, ParkedWindow>();

export type PageContextResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

/**
 * True while the origin is still showing an interstitial rather than its own
 * page. Cloudflare's managed challenge refreshes itself and clears without any
 * interaction, so the window just has to be given a moment.
 */
const CHALLENGE_PROBE = `(() => {
  const title = document.title || "";
  if (/^Just a moment|Attention Required|Verifying your browser/i.test(title)) return true;
  if (document.getElementById("challenge-error-text")) return true;
  if (document.getElementById("cf-challenge-running")) return true;
  return typeof window._cf_chl_opt !== "undefined";
})()`;

const waitForChallenge = async (window: BrowserWindow): Promise<void> => {
  const deadline = Date.now() + CHALLENGE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    let challenged: boolean;
    try {
      challenged = await window.webContents.executeJavaScript(CHALLENGE_PROBE);
    } catch {
      // A navigation mid-probe throws; the next poll sees the new document.
      challenged = true;
    }
    if (!challenged) return;
    await new Promise((resolve) => setTimeout(resolve, CHALLENGE_POLL_MS));
  }
  // Falling through is deliberate: the fetch below still runs and its status
  // tells the caller what actually happened, which beats a timeout error that
  // hides a working response.
};

const scheduleIdleClose = (origin: string) => {
  const parked = windows.get(origin);
  if (!parked) return;
  if (parked.idleTimer) clearTimeout(parked.idleTimer);
  parked.idleTimer = setTimeout(() => {
    closePageContext(origin);
  }, IDLE_CLOSE_MS);
};

const ensureWindow = async (origin: string): Promise<BrowserWindow> => {
  const existing = windows.get(origin);
  if (existing && !existing.window.isDestroyed()) {
    return existing.window;
  }

  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      // No preload and no node access: this window loads a third-party site, so
      // it gets nothing beyond an ordinary web page.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // The site is only ever a source of data; never let it open anything.
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  windows.set(origin, { window });
  window.on("closed", () => windows.delete(origin));

  await window.loadURL(origin);
  await waitForChallenge(window);
  return window;
};

/**
 * Parked windows are invisible, so they must not be mistaken for app windows:
 * counting them keeps `window-all-closed` from firing and leaves the app
 * running with no UI.
 */
export const isPageContextWindow = (window: BrowserWindow): boolean => {
  for (const parked of windows.values()) {
    if (parked.window === window) return true;
  }
  return false;
};

export const closePageContext = (origin: string) => {
  const parked = windows.get(origin);
  if (!parked) return;
  if (parked.idleTimer) clearTimeout(parked.idleTimer);
  windows.delete(origin);
  if (!parked.window.isDestroyed()) parked.window.destroy();
};

export const closeAllPageContexts = () => {
  for (const origin of [...windows.keys()]) closePageContext(origin);
};

/** A response that is the bot check rather than the page that was asked for. */
const looksChallenged = (response: PageContextResponse): boolean =>
  (response.status === 403 || response.status === 503) &&
  /Just a moment|cf_chl|Attention Required|Verifying your browser/i.test(
    response.body.slice(0, 4000)
  );

const runFetch = async (
  window: BrowserWindow,
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<PageContextResponse | { error: string }> => {
  // Serialized into the page, so everything it closes over has to be data.
  const payload = JSON.stringify({ url, init: init ?? {} });
  return (await window.webContents.executeJavaScript(`
    (async () => {
      const { url, init } = ${payload};
      try {
        const response = await fetch(url, { ...init, credentials: "include" });
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.text(),
        };
      } catch (e) {
        return { error: String(e && e.message ? e.message : e) };
      }
    })()
  `)) as PageContextResponse | { error: string };
};

/**
 * Runs `fetch` inside a page on the request's own origin and returns a plain
 * object the renderer can rebuild a Response from.
 */
export const pageContextFetch = async (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
): Promise<PageContextResponse> => {
  const target = new URL(url);
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    throw new Error(`Refusing a page-context request to ${target.protocol}`);
  }

  const origin = target.origin;

  let result = await runFetch(await ensureWindow(origin), url, init);

  // Clearance expires, and the parked window then starts getting interstitials
  // back instead of pages. Reloading it re-runs the check the same way the
  // first load did, so recover once before giving up.
  if (!("error" in result) && looksChallenged(result)) {
    const window = await ensureWindow(origin);
    await window.loadURL(origin);
    await waitForChallenge(window);
    result = await runFetch(window, url, init);
  }

  scheduleIdleClose(origin);

  if ("error" in result) {
    throw new Error(`Page-context request to ${url} failed: ${result.error}`);
  }
  return result;
};
