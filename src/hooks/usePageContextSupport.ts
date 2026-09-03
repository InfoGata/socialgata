import { Capacitor } from "@capacitor/core";
import isElectron from "is-electron";
import React from "react";
import semverGte from "semver/functions/gte";
import { useExtension } from "./useExtension";

/**
 * The extension release that can issue a request from a page on the site being
 * read — what a plugin asks for with `pageContextRequests`.
 */
export const PAGE_CONTEXT_MIN_EXTENSION_VERSION = "1.4.0";

/**
 * Whether this host can fetch from a page on the target site.
 *
 * The desktop and mobile builds carry their own transport, so they can always
 * do it. In the browser it depends on the extension being new enough; an older
 * one would install such a plugin happily and then fail every request it makes.
 *
 * `undefined` while the answer is still unknown — the extension injects
 * `window.InfoGata` after the app has rendered, and reading its version is
 * async, so callers should not treat "not yet" as "no".
 */
export const usePageContextSupport = (): boolean | undefined => {
  const { extensionDetected } = useExtension();

  // Everything that can be answered without waiting is derived rather than
  // stored, so the effect below only ever sets state from its async result.
  const nativeHost = isElectron() || Capacitor.isNativePlatform();
  const getVersion =
    extensionDetected === true ? window.InfoGata?.getVersion : undefined;

  const [versionSupported, setVersionSupported] = React.useState<
    boolean | undefined
  >(undefined);

  React.useEffect(() => {
    if (nativeHost || !getVersion) return;

    let cancelled = false;
    const check = async () => {
      try {
        const version = await getVersion();
        if (!cancelled) {
          setVersionSupported(
            semverGte(version, PAGE_CONTEXT_MIN_EXTENSION_VERSION)
          );
        }
      } catch {
        if (!cancelled) setVersionSupported(false);
      }
    };
    void check();

    return () => {
      cancelled = true;
    };
  }, [nativeHost, getVersion]);

  if (nativeHost) return true;
  if (extensionDetected === undefined) return undefined;
  if (!extensionDetected) return false;
  // An extension without `getVersion` predates it, so it predates this too.
  if (!getVersion) return false;
  return versionSupported;
};

export default usePageContextSupport;
