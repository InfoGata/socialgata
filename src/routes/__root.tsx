import NavigationMenu from "@/layouts/NavigationMenu";
import { TopBar } from "@/layouts/TopBar";
import { Outlet, createRootRoute, ScrollRestoration } from "@tanstack/react-router";
import React from "react";

export const Root: React.FC = () => {
  return (
    <div className="flex h-screen">
      <ScrollRestoration />
      <TopBar />
      <NavigationMenu />
      <main className="flex-grow p-1 overflow-auto pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export const Route = createRootRoute({
  component: Root,
});
