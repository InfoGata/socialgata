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
import { FavoritesRepoProvider } from "./sync/FavoritesRepoProvider";
import { FavoritesProvider } from "./sync/FavoritesContext";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
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
    </Provider>
  </React.StrictMode>
);
