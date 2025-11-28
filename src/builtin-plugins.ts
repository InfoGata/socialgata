import { PluginDescription } from "./types";

export const builtinPlugins: PluginDescription[] = [
  {
    id: "mastodon",
    name: "Mastodon",
    description: "Browse Mastodon instances and posts",
    preinstall: false,
  },
  {
    id: "lemmy",
    name: "Lemmy",
    description: "Browse Lemmy instances and communities",
    preinstall: false,
  },
  {
    id: "hackernews",
    name: "Hacker News",
    description: "Browse Hacker News posts and comments",
    preinstall: false,
  },
  {
    id: "bluesky",
    name: "Bluesky",
    description: "Browse Bluesky posts and profiles",
    preinstall: false,
  },
  {
    id: "twitter",
    name: "Twitter",
    description: "Browse Twitter posts (requires InfoGata extension)",
    requiresCorsDisabled: true,
    preinstall: false,
  },
  {
    id: "imageboard",
    name: "Imageboard",
    description: "Browse imageboards like 4chan",
    preinstall: false,
  },
];