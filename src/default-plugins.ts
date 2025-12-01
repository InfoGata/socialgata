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
  {
    "id": "3YKmz8pL4Rwd",
    "name": "Lemmy Plugin for SocialGata",
    "description": "Browse Lemmy feeds, communities, and comments across multiple instances",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/lemmy-socialgata@latest/manifest.json",
  },
  {
    "id": "bsky-7k9m2x5p",
    "name": "Bluesky Plugin for SocialGata",
    "description": "Browse Bluesky feeds, profiles, and posts",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/bluesky-socialgata@latest/manifest.json",
  },
  {
    "id": "a7f3e9b2c1d4",
    "name": "Twitter Plugin for SocialGata",
    "description": "Browse Twitter/X feeds, trending topics, and user profiles via TWstalker",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/twitter-socialgata@latest/manifest.json",
    requiresCorsDisabled: true,
  },
  {
    "id": "x7k9m2p4q8r1w5",
    "name": "Mastodon Plugin for SocialGata",
    "description": "Browse Mastodon feeds, users, and trending topics",
    url: "https://cdn.jsdelivr.net/gh/InfoGata/mastodon-socialgata@latest/manifest.json",
  }
];

export const defaultPluginMap = new Map(defaultPlugins.map((p) => [p.id, p]));
