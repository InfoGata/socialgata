import { ExtensionBanner } from "@/components/ExtensionBanner";
import PluginFeedButtons from "@/components/PluginFeedButttons";
import { builtinPlugins } from "@/builtin-plugins";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { isCorsDisabled } from "@/utils";
import { useExtension } from "@/hooks/useExtension";
// import PluginCards from "@/components/PluginCards/PluginCards";

export const Index: React.FC = () => {
  const corsDisabled = isCorsDisabled();
  const { extensionDetected } = useExtension();

  const visiblePlugins = builtinPlugins.filter((plugin) => {
    // If plugin requires CORS to be disabled, only show it if CORS is actually disabled
    if (plugin.requiresCorsDisabled) {
      return corsDisabled || extensionDetected;
    }
    // Otherwise, always show the plugin
    return true;
  });

  return (
    <>
      <ExtensionBanner />
      <div className="flex flex-col gap-2">
        {visiblePlugins.map((plugin) => (
          <PluginFeedButtons key={plugin.id} pluginId={plugin.id} />
        ))}
      </div>
      {/* <PluginCards /> */}
    </>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
