/**
 * Deciding whether a request has to be made from a page on its own site.
 *
 * Some sites answer on where a request came from rather than on what headers it
 * carries — twstalker.com's Cloudflare rule keys on `Sec-Fetch-Site`, so the
 * app's own `fetch` arrives as `cross-site` and is challenged while the same
 * request from a page on twstalker.com is served. `Sec-Fetch-*` is
 * browser-controlled and cannot be forged, so the only fix is to genuinely be a
 * page on that site.
 *
 * Issuing a request from inside a site's own page is a bigger capability than a
 * normal fetch, so the pattern has to name a concrete host and the url has to
 * actually be on it. A pattern with a wildcard host is ignored entirely.
 */

const wildcardHostPattern = /^\*|\*\./;

/** The host a pattern pins to, or undefined when it does not pin to one. */
export const pageContextPatternHost = (
  pattern: string
): string | undefined => {
  try {
    const url = new URL(pattern.replace(/\*/g, "placeholder"));
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    // A pattern is only as good as its host: a wildcard one would nominate
    // every site the user has open.
    const host = pattern.split("://")[1]?.split("/")[0];
    if (!host || wildcardHostPattern.test(host) || host.includes("*")) {
      return undefined;
    }
    return url.host;
  } catch {
    return undefined;
  }
};

const urlMatchesPattern = (url: string, pattern: string): boolean => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(url);
};

/**
 * True when this url must be fetched from a page on its own site: some declared
 * pattern both pins to a real host and matches the url, and the url is on that
 * same host.
 */
export const needsPageContext = (
  url: string,
  patterns: string[] | undefined
): boolean => {
  if (!patterns?.length) return false;

  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    host = parsed.host;
  } catch {
    return false;
  }

  return patterns.some((pattern) => {
    const patternHost = pageContextPatternHost(pattern);
    return !!patternHost && patternHost === host && urlMatchesPattern(url, pattern);
  });
};

import { Capacitor, registerPlugin } from "@capacitor/core";
import type { PageContextInit, PageContextResponse } from "@/types";

/** The Android/iOS half of the same transport; see `PageContextPlugin.java`. */
const NativePageContext = registerPlugin<{
  fetch(options: { url: string } & PageContextInit): Promise<PageContextResponse>;
}>("PageContext");

/**
 * The host's way of issuing a request from a page on the target site, or
 * undefined in the browser, where the extension does this instead.
 */
export const pageContextTransport = ():
  | ((url: string, init?: PageContextInit) => Promise<PageContextResponse>)
  | undefined => {
  if (window.api?.pageContextFetch) {
    return (url, init) => window.api!.pageContextFetch(url, init);
  }
  if (Capacitor.isNativePlatform()) {
    return (url, init) => NativePageContext.fetch({ url, ...(init ?? {}) });
  }
  return undefined;
};
