import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Router from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./i18n";
import { ThemeProvider } from "./providers/ThemeProvider";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider defaultTheme="light">
        <HelmetProvider>
          <Helmet>
            <title>SocialGata</title>
        </Helmet>
        <QueryClientProvider client={queryClient}>
          <Router />
          </QueryClientProvider>
        </HelmetProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
