/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensionProvider } from "@/contexts/ExtensionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Root } from "@/routes/__root";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";

export function renderWithProviders(ui: React.ReactElement) {
  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    const rootRoute = createRootRoute({
      component: Root,
    });
    const route = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <>{children}</>,
    });

    const router = createRouter({
      routeTree: rootRoute.addChildren([route]),
      history: createMemoryHistory(),
    });
    return (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider defaultTheme="dark">
            <ExtensionProvider>
              <RouterProvider router={router as any} />
            </ExtensionProvider>
          </ThemeProvider>
        </I18nextProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper }) };
}
