import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Router from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <Helmet>
          <title>SocialGata</title>
        </Helmet>
        <QueryClientProvider client={queryClient}>
          <Router />
        </QueryClientProvider>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>
);
