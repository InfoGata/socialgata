import { ExtensionBanner } from "@/components/ExtensionBanner";
import PluginFeedButtons from "@/components/PluginFeedButttons";
import PluginCards from "@/components/PluginCards/PluginCards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlugins } from "@/hooks/usePlugins";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Puzzle, Rss } from "lucide-react";
import React from "react";

export const Index: React.FC = () => {
  const { plugins, pluginsLoaded } = usePlugins();
  const feedPlugins = plugins.filter((plugin) => plugin.hasFeed);
  const hasPlugins = feedPlugins.length > 0;

  return (
    <div className="space-y-8">
      <ExtensionBanner />

      {/* Your Feeds Section */}
      {pluginsLoaded && hasPlugins && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Your Feeds</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {feedPlugins.map((plugin) => (
              <PluginFeedButtons key={plugin.id} pluginId={plugin.id!} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no plugins installed */}
      {pluginsLoaded && !hasPlugins && (
        <section className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Puzzle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to SocialGata</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Aggregate your social media feeds in one place. Install plugins below to get started, or visit the plugins page.
          </p>
          <Link
            className={cn(buttonVariants({ variant: "default" }))}
            to="/plugins"
          >
            <Puzzle className="h-4 w-4 mr-1.5" />
            Browse Plugins
          </Link>
        </section>
      )}

      {/* Discover Plugins */}
      {pluginsLoaded && (
        <DiscoverSection />
      )}
    </div>
  );
};

const DiscoverSection: React.FC = () => {
  const { plugins } = usePlugins();
  const hasAllPlugins = plugins.length >= 8; // rough check if all default plugins installed

  if (hasAllPlugins) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold tracking-tight">Discover Plugins</h2>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
          to="/plugins"
        >
          View all
        </Link>
      </div>
      <PluginCards />
    </section>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
