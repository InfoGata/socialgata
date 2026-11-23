import { Capacitor } from "@capacitor/core";
import isElectron from "is-electron";

/**
 * The service worker is for the web only. vite-plugin-pwa's own registration
 * is turned off (`injectRegister: false` in vite.config.ts) so that this file
 * can make the call.
 *
 * The native app already loads everything from the device, so a worker adds
 * nothing there. It also gets in the way of over-the-air updates: Capgo swaps
 * the bundle while the origin stays https://localhost, and a worker would
 * keep answering from its precache of the old one. Installs from before this
 * change have a worker registered, so on native it is removed along with its
 * caches.
 *
 * Electron has no worker (its renderer config has no PWA plugin) and is left
 * alone.
 */
export const setUpServiceWorker = (): void => {
  if (!("serviceWorker" in navigator) || isElectron()) return;

  if (Capacitor.isNativePlatform()) {
    void removeServiceWorker();
    return;
  }

  // Same as the registerSW.js the plugin used to inject. After load so it
  // doesn't compete with the first paint for the network.
  const register = () =>
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {});
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
};

const removeServiceWorker = async (): Promise<void> => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return;
    await Promise.all(registrations.map((r) => r.unregister()));
    // Workbox names its caches `workbox-precache-v2-<scope>` and
    // `workbox-runtime-...`. The app makes no other caches.
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n.startsWith("workbox-")).map((n) => caches.delete(n))
    );
  } catch {
    // Not fatal: nothing depends on the worker being gone except a later OTA
    // update, and the next launch tries again.
  }
};
