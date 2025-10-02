import { ServiceType } from "@/types";
import { lemmy } from "./lemmy";
import { mastodon } from "./mastodon";
import { reddit } from "./reddit";
import { hackerNews } from "./hackernews";
import { bluesky } from "./bluesky";

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
  }
  return null;
}