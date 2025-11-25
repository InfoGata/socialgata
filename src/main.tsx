import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Router from "./router";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
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
        debug: import.meta.env.MODE === "development",
        cookieless_mode: "always"
      }}
    >
      <Provider store={store}>
        <PluginsProvider>
          <FavoritesRepoProvider>
            <FavoritesProvider>
              <ThemeProvider defaultTheme="light">
                <ExtensionProvider>
                  <HelmetProvider>
                    <Helmet>
                      <title>SocialGata</title>
                    </Helmet>
                    <Router />
                  </HelmetProvider>
                </ExtensionProvider>
              </ThemeProvider>
            </FavoritesProvider>
          </FavoritesRepoProvider>
        </PluginsProvider>
      </Provider>
    </PostHogProvider>
  </React.StrictMode>
);