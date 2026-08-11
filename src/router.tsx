import {
  RouterProvider,
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";
import isElectron from "is-electron";
import { Capacitor } from "@capacitor/core";
import { routeTree } from "./routeTree.gen";
import Spinner from "./components/Spinner";
import RouteErrorComponent from "./components/RouteErrorComponent";
import { usePlugins } from "./hooks/usePlugins";

export interface MyRouterContext {
  accessToken: string;
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: Spinner,
  // Set once here rather than per route: every route loads through a plugin and
  // can fail the same ways, and a new route would otherwise silently fall back
  // to the router's unstyled built-in error box.
  defaultErrorComponent: RouteErrorComponent,
  scrollRestoration: true,
  context: {
    plugins: undefined!
  },
  ...(isElectron() || Capacitor.isNativePlatform()
    ? { history: createHashHistory() }
    : {}),
});
export type RouterType = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router: React.FC = () => {
  const { plugins, pluginsLoaded } = usePlugins();

  if (!pluginsLoaded) {
    return <Spinner />;
  }

  return <RouterProvider router={router} context={{ plugins }} />;
};

export default Router;
