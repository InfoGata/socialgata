import { ServiceType } from "@/types";
import { lemmy } from "./lemmy";
import { mastodon } from "./mastodon";
import { reddit } from "./reddit";
import { hackerNews } from "./hackernews";
import { bluesky } from "./bluesky";
import { twitter } from "./twitter";
import imageboard from "./imageboard";

export const getService = (serviceName: string): ServiceType | null => {
  switch (serviceName) {
    case "reddit":
      return reddit;
    case "mastodon":
      return mastodon;
    case "lemmy":
      return lemmy;
    case "hackernews":
      return hackerNews;
    case "bluesky":
      return bluesky;
    case "twitter":
      return twitter;
    case "imageboard":
      return imageboard;
  }
  return null;
}