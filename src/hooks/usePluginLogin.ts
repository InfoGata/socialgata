import React from "react";
import type { PluginFrameContainer } from "@/contexts/PluginsContext";

/**
 * Hook that manages plugin login/logout with secure popup-based OAuth.
 *
 * Opens a blank popup synchronously (avoiding popup blockers), passes a
 * cryptographically random popup name to the plugin, and relays the
 * OAuth callback URL back to the plugin via onLoginCallback.
 */
export function usePluginLogin(plugin: PluginFrameContainer | undefined) {
  const [hasLogin, setHasLogin] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const check = async () => {
      if (!plugin) return;
      const canLogin = await plugin.hasDefined.onLogin();
      setHasLogin(canLogin);
      if (canLogin && (await plugin.hasDefined.onIsLoggedIn())) {
        setIsLoggedIn(await plugin.remote.onIsLoggedIn());
      }
    };
    check();
  }, [plugin]);

  const login = React.useCallback(
    async (apiKey = "", apiSecret = "") => {
      if (!plugin || !(await plugin.hasDefined.onLogin())) return;

      const popupName = crypto.randomUUID();
      const popup = window.open("about:blank", popupName, "width=600,height=700");

      // Plugin returns the OAuth URL; host navigates the popup
      const response = await plugin.remote.onLogin({ apiKey, apiSecret, popupName });
      if (response?.url && popup) {
        popup.location.href = response.url;
      }

      // Listen for the callback from the popup
      if (popup && (await plugin.hasDefined.onLoginCallback())) {
        const callbackUrl = await waitForPopupCallback(popup);
        if (callbackUrl) {
          await plugin.remote.onLoginCallback({ url: callbackUrl });
        }
      }

      if (await plugin.hasDefined.onIsLoggedIn()) {
        setIsLoggedIn(await plugin.remote.onIsLoggedIn());
      }
    },
    [plugin]
  );

  const logout = React.useCallback(async () => {
    if (!plugin || !(await plugin.hasDefined.onLogout())) return;
    await plugin.remote.onLogout();
    if (await plugin.hasDefined.onIsLoggedIn()) {
      setIsLoggedIn(await plugin.remote.onIsLoggedIn());
    }
  }, [plugin]);

  return { hasLogin, isLoggedIn, login, logout };
}

/**
 * Wait for the popup to post back the OAuth callback URL.
 * Resolves with the URL string or null if the popup is closed without completing.
 */
function waitForPopupCallback(popup: Window): Promise<string | null> {
  return new Promise((resolve) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== popup) return;
      if (event.data?.url) {
        cleanup();
        resolve(event.data.url);
      }
    };

    const intervalId = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve(null);
      }
    }, 500);

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(intervalId);
      if (!popup.closed) {
        popup.close();
      }
    };

    window.addEventListener("message", handleMessage);
  });
}
