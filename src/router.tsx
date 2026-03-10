import {
  RouterProvider,
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";
import isElectron from "is-electron";
import { Capacitor } from "@capacitor/core";
import { routeTree } from "./routeTree.gen";
import Spinner from "./components/Spinner";
import { usePlugins } from "./hooks/usePlugins";

export interface MyRouterContext {
  accessToken: string;
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: Spinner,
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
