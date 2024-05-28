import RedditService from "./reddit"

export const getService = (serviceName: string) => {
  switch (serviceName) {
    case "reddit":
      return new RedditService();
  }
  return null;
}