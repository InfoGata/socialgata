export interface PluginDescription {
  id: string;
  name: string;
  url: string;
  description: string;
  preinstall?: boolean;
  requiresCorsDisabled?: boolean;
}

export const defaultPlugins: PluginDescription[] = [
  // Add installable plugins here as they become available
  // Example:
  {
    id: "example-plugin-id",
    name: "Example Plugin",
    description: "Description of what this plugin does",
    url: "https://example.com/plugins/example/manifest.json",
    preinstall: false,
  },
];

export const defaultPluginMap = new Map(defaultPlugins.map((p) => [p.id, p]));
