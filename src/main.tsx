import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { store } from "./store/store";
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
        <ThemeProvider defaultTheme="light">
          <PluginsProvider>
            <FavoritesRepoProvider>
              <FavoritesProvider>
                <ExtensionProvider>
                  <HelmetProvider>
                    <Helmet>
                      <title>SocialGata</title>
                    </Helmet>
                    <Router />
                  </HelmetProvider>
                </ExtensionProvider>
              </FavoritesProvider>
            </FavoritesRepoProvider>
          </PluginsProvider>
        </ThemeProvider>
      </Provider>
    </PostHogProvider>
  </React.StrictMode>
);