import React from "react";
import posthog from "posthog-js";
import { useAppSelector } from "@/store/hooks";
import { analyticsConfigured, doNotTrackEnabled, shouldCapture } from "@/lib/analytics";

/**
 * Starts PostHog when, and only when, the reader's analytics preference allows
 * it, and stops sending the moment it doesn't.
 *
 * PostHog's own opt_in_capturing/opt_out_capturing and respect_dnt can't be
 * used for this: with cookieless_mode "always" the SDK ignores all three
 * ('Consent opt in/out is not valid with cookieless_mode="always" and will be
 * ignored', and is_capturing() is hard-wired to true). So the choice is
 * enforced here instead, in two places:
 *
 * - A reader who has turned analytics off, or whose browser sends Do Not
 *   Track, never has PostHog initialised, so it makes no requests at all.
 * - Turning it off after PostHog has started can't un-initialise it, so every
 *   event also passes through before_send, which drops it unless capturing is
 *   still allowed at that moment. Exceptions and pageviews go through the same
 *   path as everything else.
 *
 * A build with no key configured initialises nothing. Renders nothing; it has
 * to sit inside PersistGate so it acts on the remembered choice rather than the
 * default.
 */
const Analytics: React.FC = () => {
  const analyticsEnabled = useAppSelector((state) => state.ui.analyticsEnabled);
  const allowed = shouldCapture(analyticsEnabled, doNotTrackEnabled());

  // Read by before_send, which PostHog calls outside React. Kept current from an
  // effect, which runs before the init effect below on the render it starts in.
  const allowedRef = React.useRef(allowed);
  React.useEffect(() => {
    allowedRef.current = allowed;
  }, [allowed]);

  React.useEffect(() => {
    if (!analyticsConfigured || !allowed || posthog.__loaded) return;

    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: "2025-05-24",
      capture_exceptions: true,
      cookieless_mode: "always",
      before_send: (event) => (allowedRef.current ? event : null),
    });
  }, [allowed]);

  return null;
};

export default Analytics;
