import { Capacitor, registerPlugin } from "@capacitor/core";

/** See `SiteVisitPlugin.java`. */
const NativeSiteVisit = registerPlugin<{
  open(options: { url: string; closeLabel?: string }): Promise<void>;
}>("SiteVisit");

/**
 * Opens a site inside the app and resolves once the user closes it, or
 * undefined where a plain link already does the job.
 *
 * Visiting a site is how a cookieless block clears, but the cookies have to
 * land where the app's requests read them. In a browser a new tab shares them;
 * on Android a link goes to the system browser, whose cookies the app never
 * sees, so the page has to be shown in the app's own WebView instead.
 */
export const siteVisitTransport = ():
  | ((url: string, closeLabel?: string) => Promise<void>)
  | undefined => {
  if (Capacitor.getPlatform() === "android") {
    return (url, closeLabel) => NativeSiteVisit.open({ url, closeLabel });
  }
  return undefined;
};
