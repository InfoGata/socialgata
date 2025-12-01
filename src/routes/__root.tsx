import { PluginFrameContainer } from "@/contexts/PluginsContext";
import NavigationMenu from "@/layouts/NavigationMenu";
import { TopBar } from "@/layouts/TopBar";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React from "react";

export const Root: React.FC = () => {
  return (
    <div className="flex h-screen">
      <TopBar />
      <NavigationMenu />
      <main className="flex-grow p-1 overflow-auto pt-16">
        <Outlet />
      </main>
    </div>
  );
};
interface MyRouterContext {
  plugins: PluginFrameContainer[];
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});
