import { ServiceType } from "@/types";
import { PluginServiceAdapter } from "./plugin-service-adapter";
import { PluginFrameContainer } from "@/contexts/PluginsContext";

// Cache for dynamic plugin services
const pluginServiceCache = new Map<string, ServiceType>();

// This will be set by the application when the plugin context is available
let dynamicPlugins: PluginFrameContainer[] = [];

export const setDynamicPlugins = (plugins: PluginFrameContainer[]) => {
  dynamicPlugins = plugins;
  // Clear cache when plugins change
  pluginServiceCache.clear();
};

export const getService = (serviceName: string): ServiceType | null => {
  // Check if we have a dynamic plugin with this ID
  const dynamicPlugin = dynamicPlugins.find((p) => p.id === serviceName);
  if (dynamicPlugin) {
    // Return cached adapter or create new one
    if (!pluginServiceCache.has(serviceName)) {
      pluginServiceCache.set(serviceName, new PluginServiceAdapter(dynamicPlugin));
    }
    return pluginServiceCache.get(serviceName)!;
  }

  return null;
}