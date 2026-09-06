import semverGte from "semver/functions/gte";
import isElectron from "is-electron";
import { Capacitor } from "@capacitor/core";

// Polled on an interval, so it can be called after the DOM it reads is gone --
// in tests, once vitest has torn the environment down. A bare `window` throws
// ReferenceError there, and inside a timer that is an uncaught exception.
export const hasExtension = () => {
  return typeof window !== "undefined" && typeof window.InfoGata !== "undefined";
};

export const hasAuthentication = async () => {
  const minVersion = "1.1.0";
  if (hasExtension() && window.InfoGata?.getVersion) {
    const version = await window.InfoGata.getVersion();
    return semverGte(version, minVersion);
  }
  return Capacitor.isNativePlatform();
};

export const isCorsDisabled = () => {
  return hasExtension() || isElectron() || Capacitor.isNativePlatform();
}