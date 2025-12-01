import { RouterProvider, createRouter } from "@tanstack/react-router";
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
  }
});
export type RouterType = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router: React.FC = () => {
  const { plugins } = usePlugins();
  return <RouterProvider router={router} context={{ plugins }} />;
};

export default Router;
