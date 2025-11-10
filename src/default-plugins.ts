export interface PluginDescription {
  id: string;
  name: string;
  requiresCorsDisabled?: boolean;
}

export const defaultPlugins: PluginDescription[] = [
  {
    id: "reddit",
    name: "Reddit",
  },
  {
    id: "mastodon",
    name: "Mastodon",
  },
  {
    id: "lemmy",
    name: "Lemmy",
  },
  {
    id: "hackernews", 
    name: "Hacker News",
  },
  {
    id: "bluesky",
    name: "Bluesky",
  },
  {
    id: "twitter",
    name: "Twitter",
    requiresCorsDisabled: true,
  },
  {
    id: "imageboard",
    name: "Imageboard",
  },
];