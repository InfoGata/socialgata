import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import Spinner from "./components/Spinner";
import { PluginServiceSync } from "./components/PluginServiceSync";

export interface MyRouterContext {
  accessToken: string;
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: Spinner,
  scrollRestoration: true,
});
export type RouterType = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router: React.FC = () => {
  return (
    <>
      <PluginServiceSync />
      <RouterProvider router={router} />
    </>
  );
};

export default Router;
