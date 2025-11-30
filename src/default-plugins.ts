import { PluginDescription } from "./types";

export const defaultPlugins: PluginDescription[] = [
  {
    id: "2XJix5oj3Xqd",
    name: "Reddit Plugin for SocialGata",
    description: "Browse Reddit feeds, communities, and comments",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/reddit-socialgata@latest/manifest.json",
  },
  {
    id: "IB4ch4nPl9n",
    name: "Imageboard Plugin for SocialGata",
    description: "Browse imageboards like 4chan, lainchan, leftypol, endchan, and 2ch.hk",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/imageboard-socialgata@latest/manifest.json",
  },
  {
    id: "HN4x8k2m9Qpd",
    name: "Hacker News Plugin for SocialGata",
    description: "Browse Hacker News posts and comments",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/hackernews-socialgata@latest/manifest.json",
  },
];

export const defaultPluginMap = new Map(defaultPlugins.map((p) => [p.id, p]));
