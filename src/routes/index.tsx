import { ExtensionBanner } from "@/components/ExtensionBanner";
import PluginFeedButtons from "@/components/PluginFeedButttons";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import PluginCards from "@/components/PluginCards/PluginCards";
import { usePlugins } from "@/hooks/usePlugins";

export const Index: React.FC = () => {
  const { plugins, pluginsLoaded } = usePlugins();

  return (
    <>
      <ExtensionBanner />
      <div className="flex flex-col gap-2">
        {pluginsLoaded && plugins.map((plugin) => (
          <PluginFeedButtons key={plugin.id} pluginId={plugin.id!} />
        ))}
      </div>
      <PluginCards />
    </>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
