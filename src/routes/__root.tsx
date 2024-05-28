import { MyRouterContext } from "@/router";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React from "react";

const Root: React.FC = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});
