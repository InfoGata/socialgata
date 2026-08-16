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
        {/* The bar is ~49px; the extra top padding here is just breathing room,
            which a phone screen has less to spare. `min-w-0` keeps a wide child
            from stretching the flex row into a sideways scroll. */}
        <main className="grow min-w-0 p-1 pt-14 sm:pt-16">
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
