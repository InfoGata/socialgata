import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePageContextSupport } from "@/hooks/usePageContextSupport";

const mocks = vi.hoisted(() => ({
  extensionDetected: undefined as boolean | undefined,
  isElectron: false,
  isNative: false,
}));

vi.mock("@/hooks/useExtension", () => ({
  useExtension: () => ({ extensionDetected: mocks.extensionDetected }),
}));
vi.mock("is-electron", () => ({ default: () => mocks.isElectron }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mocks.isNative },
}));

afterEach(() => {
  mocks.extensionDetected = undefined;
  mocks.isElectron = false;
  mocks.isNative = false;
  delete (window as { InfoGata?: unknown }).InfoGata;
});

const setVersion = (version: string) => {
  (window as unknown as { InfoGata: unknown }).InfoGata = {
    getVersion: () => Promise.resolve(version),
  };
};

describe("usePageContextSupport", () => {
  it("is undefined until the extension has been looked for", () => {
    const { result } = renderHook(() => usePageContextSupport());
    expect(result.current).toBeUndefined();
  });

  it("supports the desktop build without an extension", async () => {
    mocks.isElectron = true;
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("supports the mobile build without an extension", async () => {
    mocks.isNative = true;
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("is false in a browser with no extension", async () => {
    mocks.extensionDetected = false;
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("accepts an extension at the minimum version", async () => {
    mocks.extensionDetected = true;
    setVersion("1.4.0");
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("accepts a newer extension", async () => {
    mocks.extensionDetected = true;
    setVersion("2.0.1");
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("rejects an older extension", async () => {
    mocks.extensionDetected = true;
    setVersion("1.3.0");
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("rejects an extension too old to report a version", async () => {
    mocks.extensionDetected = true;
    (window as unknown as { InfoGata: unknown }).InfoGata = {};
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(false));
  });

  it("rejects when the version lookup throws", async () => {
    mocks.extensionDetected = true;
    (window as unknown as { InfoGata: unknown }).InfoGata = {
      getVersion: () => Promise.reject(new Error("gone")),
    };
    const { result } = renderHook(() => usePageContextSupport());
    await waitFor(() => expect(result.current).toBe(false));
  });
});
