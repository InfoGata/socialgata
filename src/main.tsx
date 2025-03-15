import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Router from "./router";
import "./i18n";
import { ThemeProvider } from "./providers/ThemeProvider";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider defaultTheme="light">
        <HelmetProvider>
          <Helmet>
            <title>SocialGata</title>
        </Helmet>
          <Router />
        </HelmetProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
