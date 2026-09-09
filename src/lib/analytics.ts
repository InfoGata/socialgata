/**
 * Whether this build has analytics at all. An AGPL fork or a self-hoster that
 * never sets a key gets no provider, no script and no switch — rather than a
 * provider trusted to stay quiet on its own.
 */
export const analyticsConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY
);

/**
 * Whether the browser is asking not to be tracked.
 *
 * PostHog checks this itself when `respect_dnt` is set, but the answer is
 * needed here too: the preference has to be shown as overridden rather than as
 * a switch that appears to do nothing, and the app decides what to send rather
 * than depending on how the SDK resolves an explicit opt-in against a Do Not
 * Track header.
 */
export const doNotTrackEnabled = (): boolean => {
  const nav = navigator as Navigator & { msDoNotTrack?: string | null };
  const win = window as Window & { doNotTrack?: string | null };
  return [nav.doNotTrack, nav.msDoNotTrack, win.doNotTrack].some(
    (flag) => flag === "1" || flag === "yes"
  );
};

/** What the app actually asks PostHog to do: the reader's choice, with Do Not Track able to veto it but never to enable it. */
export const shouldCapture = (
  analyticsEnabled: boolean,
  doNotTrack: boolean
): boolean => analyticsConfigured && analyticsEnabled && !doNotTrack;
