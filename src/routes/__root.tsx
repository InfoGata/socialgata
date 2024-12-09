import { Outlet, createRootRoute, ScrollRestoration } from "@tanstack/react-router";
import React from "react";

const Root: React.FC = () => {
  return (
    <div>
      <ScrollRestoration />
      <Outlet />
    </div>
  );
};

export const Route = createRootRoute({
  component: Root,
});
