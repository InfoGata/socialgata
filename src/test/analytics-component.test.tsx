import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render } from "@testing-library/react";
import { Provider } from "react-redux";

const posthogMock = vi.hoisted(() => ({
  __loaded: false,
  init: vi.fn(),
}));

// The real client is the seam, not a hook wrapping it: the previous version of
// this test mocked usePostHog, and so passed while opt-out did nothing at all
// in cookieless "always" mode.
vi.mock("posthog-js", () => ({ default: posthogMock }));

// A key has to exist for the component to do anything. Hoisted because
// analyticsConfigured is read when lib/analytics is imported, and without it
// the suite would pass or fail depending on whether the machine has a .env.
vi.hoisted(() => vi.stubEnv("VITE_PUBLIC_POSTHOG_KEY", "phc_test"));

import Analytics from "@/components/Analytics";
import { store } from "@/store/store";
import { initialState, setAnalyticsEnabled } from "@/store/reducers/uiSlice";

type InitOptions = {
  before_send: (event: { event: string } | null) => unknown;
};

const setDnt = (value: string | null) =>
  vi.stubGlobal("navigator", { ...navigator, doNotTrack: value });

const renderAnalytics = () =>
  render(
    <Provider store={store}>
      <Analytics />
    </Provider>
  );

beforeEach(() => {
  posthogMock.__loaded = false;
  posthogMock.init.mockReset();
  posthogMock.init.mockImplementation(() => {
    posthogMock.__loaded = true;
  });
  setDnt(null);
  store.dispatch(setAnalyticsEnabled(initialState.analyticsEnabled));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  store.dispatch(setAnalyticsEnabled(initialState.analyticsEnabled));
});

describe("Analytics", () => {
  it("starts PostHog when the reader allows it", () => {
    renderAnalytics();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });

  it("never starts PostHog for a reader who turned analytics off", () => {
    // Not started and then silenced: an uninitialised client makes no
    // requests at all.
    store.dispatch(setAnalyticsEnabled(false));
    renderAnalytics();

    expect(posthogMock.init).not.toHaveBeenCalled();
  });

  it("never starts PostHog under Do Not Track, even with the setting on", () => {
    setDnt("1");
    renderAnalytics();

    expect(posthogMock.init).not.toHaveBeenCalled();
  });

  it("drops events once analytics is turned off mid-session", () => {
    // PostHog's own opt-out is ignored in cookieless "always" mode, so
    // before_send is what actually stops events after it has started.
    renderAnalytics();
    const options = posthogMock.init.mock.calls[0][1] as InitOptions;
    const event = { event: "$pageview" };

    expect(options.before_send(event)).toBe(event);

    act(() => {
      store.dispatch(setAnalyticsEnabled(false));
    });

    expect(options.before_send(event)).toBeNull();
  });

  it("starts PostHog if analytics is turned back on", () => {
    store.dispatch(setAnalyticsEnabled(false));
    renderAnalytics();

    act(() => {
      store.dispatch(setAnalyticsEnabled(true));
    });

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
  });
});
