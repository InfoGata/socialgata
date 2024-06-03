import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import Spinner from "./components/Spinner";

export interface MyRouterContext {
  accessToken: string;
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: Spinner,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router: React.FC = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default Router;
