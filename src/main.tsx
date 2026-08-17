import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store";
import Router from "./router";
import "./i18n";
import { ThemeProvider } from "@infogata/shadcn-vite-theme-provider";
import { ExtensionProvider } from "./contexts/ExtensionContext";
import { PluginsProvider } from "./contexts/PluginsContext";
import { FavoritesRepoProvider } from "./sync/FavoritesRepoProvider";
import { FavoritesProvider } from "./sync/FavoritesContext";
import { PostHogProvider } from "posthog-js/react";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_exceptions: true,
        cookieless_mode: "always"
      }}
    >
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider defaultTheme="system">
          {/* Above PluginsProvider on purpose: sonner only shows toasts raised
              after the Toaster mounts, and plugin loading can raise one before
              the router (and so the app shell) has rendered. */}
          <Toaster />
          {/* Outside PluginsProvider: the plugin context reads extension
              detection to re-register site redirects once the extension
              injects itself, which can happen after the first render. */}
          <ExtensionProvider>
            <PluginsProvider>
              <FavoritesRepoProvider>
                <FavoritesProvider>
                  <title>SocialGata</title>
                  <Router />
                </FavoritesProvider>
              </FavoritesRepoProvider>
            </PluginsProvider>
          </ExtensionProvider>
        </ThemeProvider>
      </PersistGate>
      </Provider>
    </PostHogProvider>
  </React.StrictMode>
);