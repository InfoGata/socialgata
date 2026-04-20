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
          <PluginsProvider>
            <FavoritesRepoProvider>
              <FavoritesProvider>
                <ExtensionProvider>
                  <title>SocialGata</title>
                  <Router />
                </ExtensionProvider>
              </FavoritesProvider>
            </FavoritesRepoProvider>
          </PluginsProvider>
        </ThemeProvider>
      </PersistGate>
      </Provider>
    </PostHogProvider>
  </React.StrictMode>
);