import { ServiceType } from "@/types";
import RedditService from "./reddit"

export const getService = (serviceName: string) : ServiceType | null => {
  switch (serviceName) {
    case "reddit":
      return new RedditService();
  }
  return null;
}