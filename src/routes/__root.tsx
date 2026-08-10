import { PluginFrameContainer } from "@/contexts/PluginsContext";
import NavigationMenu from "@/layouts/NavigationMenu";
import { TopBar } from "@/layouts/TopBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React from "react";

export const Root: React.FC = () => {
  // The window is the scroll container on purpose: TanStack Router's scroll
  // restoration only resets/restores `window` (plus opted-in elements), so
  // scrolling inside <main> left pagination stuck at the previous offset.
  return (
    // One provider for the whole app, per Radix. It used to sit inside
    // FavoriteButton, which meant a provider per button — hundreds of them on a
    // comment thread, for no benefit.
    <TooltipProvider>
      <div className="flex min-h-screen">
        <TopBar />
        <NavigationMenu />
        <main className="flex-grow p-1 pt-16">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
};
interface MyRouterContext {
  plugins: PluginFrameContainer[];
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});
