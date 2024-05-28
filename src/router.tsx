import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import Spinner from "./components/Spinner";
import { useAppSelector } from "./store/hooks";

export interface MyRouterContext {
  accessToken: string;
}

const router = createRouter({
  routeTree,
  defaultPendingComponent: Spinner,
  context: { accessToken: undefined! },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router: React.FC = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return (
    <RouterProvider router={router} context={{ accessToken: accessToken }} />
  );
};

export default Router;
