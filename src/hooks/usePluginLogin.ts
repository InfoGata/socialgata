import React from "react";
import type { PluginFrameContainer } from "@/contexts/PluginsContext";

/**
 * Hook that manages plugin login/logout with secure popup-based OAuth.
 *
 * Opens a blank popup before anything is awaited, so the browser still sees
 * the click that caused it and doesn't block it. Passes a cryptographically
 * random popup name to the plugin, and relays the OAuth callback URL back to
 * the plugin via onLoginCallback.
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
      if (!plugin) return;

      // Opened first, before any await. A popup is only allowed while the
      // browser still considers the click that led to it recent, and the
      // capability check below is a round trip through the plugin's iframe --
      // the comment above used to claim this was synchronous while an await
      // sat in front of it.
      const popupName = crypto.randomUUID();
      const popup = window.open("about:blank", popupName, "width=600,height=700");

      if (!(await plugin.hasDefined.onLogin())) {
        popup?.close();
        return;
      }

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
    const finish = (url: string) => {
      cleanup();
      resolve(url);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== popup) return;
      if (event.data?.url) finish(event.data.url);
    };

    // The popup also announces itself on a same-origin channel, which arrives
    // even when it no longer has an opener to post to — the case where sign-in
    // used to hang forever. Whichever lands first wins.
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("socialgata-oauth");
      channel.onmessage = (event: MessageEvent) => {
        if (event.data?.url) finish(event.data.url);
      };
    } catch {
      // No BroadcastChannel; the opener message is the only route.
    }

    const intervalId = setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve(null);
      }
    }, 500);

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      channel?.close();
      clearInterval(intervalId);
      if (!popup.closed) {
        popup.close();
      }
    };

    window.addEventListener("message", handleMessage);
  });
}
