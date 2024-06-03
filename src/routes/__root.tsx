import { Outlet, createRootRoute } from "@tanstack/react-router";
import React from "react";

const Root: React.FC = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export const Route = createRootRoute({
  component: Root,
});
