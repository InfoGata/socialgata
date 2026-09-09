import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { Provider } from "react-redux";
import React from "react";

const optIn = vi.fn();
const optOut = vi.fn();

// The component's whole job is talking to this client, so it's the seam.
vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({
    opt_in_capturing: optIn,
    opt_out_capturing: optOut,
  }),
}));

import AnalyticsPreference from "@/components/AnalyticsPreference";
import { store } from "@/store/store";
import { initialState, setAnalyticsEnabled } from "@/store/reducers/uiSlice";

afterEach(cleanup);

const setDnt = (value: string | null) =>
  vi.stubGlobal("navigator", { ...navigator, doNotTrack: value });

beforeEach(() => {
  optIn.mockClear();
  optOut.mockClear();
  setDnt(null);
  store.dispatch(setAnalyticsEnabled(initialState.analyticsEnabled));
});

afterEach(() => {
  vi.unstubAllGlobals();
  store.dispatch(setAnalyticsEnabled(initialState.analyticsEnabled));
});

const renderPreference = () =>
  render(
    <Provider store={store}>
      <AnalyticsPreference />
    </Provider>
  );

describe("AnalyticsPreference", () => {
  it("opts in when the reader allows it", () => {
    store.dispatch(setAnalyticsEnabled(true));
    renderPreference();

    expect(optIn).toHaveBeenCalled();
    expect(optOut).not.toHaveBeenCalled();
  });

  it("opts in without capturing an event for having done so", () => {
    store.dispatch(setAnalyticsEnabled(true));
    renderPreference();

    // The default behaviour captures an $opt_in event, which would be a capture
    // nobody asked for on every single load.
    expect(optIn).toHaveBeenCalledWith({ captureEventName: false });
  });

  it("opts out when the reader turned it off", () => {
    store.dispatch(setAnalyticsEnabled(false));
    renderPreference();

    expect(optOut).toHaveBeenCalled();
    expect(optIn).not.toHaveBeenCalled();
  });

  it("opts out under Do Not Track even with the setting on", () => {
    setDnt("1");
    store.dispatch(setAnalyticsEnabled(true));
    renderPreference();

    // The browser's request wins over a setting the reader likely never opened.
    expect(optOut).toHaveBeenCalled();
    expect(optIn).not.toHaveBeenCalled();
  });

  it("follows the preference when it changes", () => {
    store.dispatch(setAnalyticsEnabled(true));
    renderPreference();
    optIn.mockClear();

    React.act(() => {
      store.dispatch(setAnalyticsEnabled(false));
    });

    expect(optOut).toHaveBeenCalled();
  });
});
