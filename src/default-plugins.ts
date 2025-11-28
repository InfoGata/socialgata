import { PluginDescription } from "./types";

export const defaultPlugins: PluginDescription[] = [
  {
    id: "2XJix5oj3Xqd",
    name: "Reddit Plugin for SocialGata",
    description: "Browse Reddit feeds, communities, and comments",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/reddit-socialgata@latest/manifest.json",
  },
];

export const defaultPluginMap = new Map(defaultPlugins.map((p) => [p.id, p]));
