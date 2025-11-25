import { useEffect } from "react";
import { usePlugins } from "@/hooks/usePlugins";
import { setDynamicPlugins } from "@/services/selector-service";

/**
 * Component that syncs the plugin context with the service selector.
 * This needs to be inside the PluginsProvider.
 */
export const PluginServiceSync = () => {
  const { plugins } = usePlugins();

  useEffect(() => {
    setDynamicPlugins(plugins);
  }, [plugins]);

  return null;
};
