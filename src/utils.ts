import semverGte from "semver/functions/gte";
import isElectron from "is-electron";
import { Capacitor } from "@capacitor/core";
import { hasExtension } from "@infogata/extension-components";

// Re-exported so the rest of the app keeps importing detection from one place.
// The shared version also honours `?noextension`, which makes the app behave as
// if the extension were not installed -- the only way to exercise that path in
// a browser that has it.
export { hasExtension };

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