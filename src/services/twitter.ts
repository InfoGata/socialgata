import { ServiceType } from "@/types";
import {
  GetFeedResponse,
  GetUserRequest,
  GetUserReponse,
  Post,
  SearchRequest,
  SearchResponse,
  GetTrendingTopicsRequest,
  GetTrendingTopicsResponse,
  TrendingTopic,
  GetTrendingTopicFeedRequest,
  GetTrendingTopicFeedResponse,
} from "@/plugintypes";

const pluginName = "twitter";
const TWSTALKER_BASE_URL = "https://twstalker.com";
const CORS_PROXY = "http://localhost:8888/.netlify/functions/proxy?url=";

// Helper function to parse engagement counts like "2K", "1.5M", "362"
function parseEngagementCount(countStr: string): number {
  if (!countStr) return 0;

  const cleaned = countStr.trim();

  if (cleaned.includes("M")) {
    return Math.round(parseFloat(cleaned.replace("M", "")) * 1_000_000);
  }

  if (cleaned.includes("K")) {
    return Math.round(parseFloat(cleaned.replace("K", "")) * 1_000);
  }

  if (cleaned.includes("B")) {
    return Math.round(parseFloat(cleaned.replace("B", "")) * 1_000_000_000);
  }

  return parseInt(cleaned.replace(/,/g, "")) || 0;
}

class TwitterService implements ServiceType {
  platformType = "microblog" as const;

  private async fetchHTML(url: string): Promise<Document> {
    // Encode the URL as a query parameter for the CORS proxy
    const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const response = await fetch(proxiedUrl);
    const html = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  }

  async getTrendingTopics(request?: GetTrendingTopicsRequest): Promise<GetTrendingTopicsResponse> {
    try {
      const doc = await this.fetchHTML(TWSTALKER_BASE_URL);

      // Find all trending topic links
      const trendElements = doc.querySelectorAll('a[href*="/search/"]');
      const items: TrendingTopic[] = [];

      trendElements.forEach((element) => {
        const href = element.getAttribute("href");
        if (!href) return;

        // Extract topic name from heading or link text
        const heading = element.querySelector("h4");
        const name = heading?.textContent?.trim() || element.textContent?.trim();
        if (!name) return;

        items.push({
          name: name,
          url: `${TWSTALKER_BASE_URL}${href}`,
        });
      });

      // Remove duplicates by name
      const uniqueItems = Array.from(
        new Map(items.map(item => [item.name, item])).values()
      );

      const limit = request?.limit ?? 20;
      const offset = request?.offset ?? 0;

      return {
        items: uniqueItems.slice(offset, offset + limit),
      };
    } catch (error) {
      console.error("Error fetching trending topics:", error);
      return { items: [] };
    }
  }

  async getTrendingTopicFeed(request: GetTrendingTopicFeedRequest): Promise<GetTrendingTopicFeedResponse> {
    try {
      const encodedTopic = encodeURIComponent(request.topicName);
      const url = `${TWSTALKER_BASE_URL}/search/${encodedTopic}`;
      const doc = await this.fetchHTML(url);

      const posts = await this.scrapePostsFromDocument(doc);

      return {
        items: posts,
        topic: {
          name: request.topicName,
        },
      };
    } catch (error) {
      console.error("Error fetching trending topic feed:", error);
      return { items: [] };
    }
  }

  async getUser(request: GetUserRequest): Promise<GetUserReponse> {
    try {
      const url = `${TWSTALKER_BASE_URL}/${request.apiId}`;
      const doc = await this.fetchHTML(url);

      // Extract user info
      const nameElement = doc.querySelector('h1');
      const nameText = nameElement?.textContent?.trim() || "";
      const nameParts = nameText.split("@");
      const displayName = nameParts[0]?.trim();

      // Extract avatar
      const avatarImg = doc.querySelector('img[alt*="Profile Picture"]');
      const avatar = avatarImg?.getAttribute("src") ?? undefined;

      const posts = await this.scrapePostsFromDocument(doc);

      return {
        user: {
          apiId: request.apiId,
          name: displayName || request.apiId,
          avatar: avatar,
        },
        items: posts,
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      return { items: [] };
    }
  }

  async getFeed(): Promise<GetFeedResponse> {
    // Use trending topics feed as the default feed
    try {
      const trending = await this.getTrendingTopics({ limit: 1 });
      if (trending.items.length > 0) {
        const topTrend = trending.items[0];
        const feedResponse = await this.getTrendingTopicFeed({
          topicName: topTrend.name,
        });
        return {
          items: feedResponse.items,
        };
      }
      return { items: [] };
    } catch (error) {
      console.error("Error fetching feed:", error);
      return { items: [] };
    }
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const encodedQuery = encodeURIComponent(request.query);
      const url = `${TWSTALKER_BASE_URL}/search/${encodedQuery}`;
      const doc = await this.fetchHTML(url);

      const posts = await this.scrapePostsFromDocument(doc);

      return {
        items: posts,
      };
    } catch (error) {
      console.error("Error searching:", error);
      return { items: [] };
    }
  }

  private async scrapePostsFromDocument(doc: Document): Promise<Post[]> {
    const posts: Post[] = [];

    // Find all post containers - they typically have links to status URLs
    const postElements = doc.querySelectorAll('a[href*="/status/"]');
    const processedIds = new Set<string>();

    postElements.forEach((statusLink) => {
      try {
        const href = statusLink.getAttribute("href");
        if (!href) return;

        // Extract post ID from URL like /username/status/1234567890
        const match = href.match(/\/status\/(\d+)/);
        if (!match) return;

        const postId = match[1];
        if (processedIds.has(postId)) return;
        processedIds.add(postId);

        // Find the post container - usually a parent div
        let postContainer = statusLink.closest("div");
        while (postContainer && postContainer.children.length < 2) {
          postContainer = postContainer.parentElement as HTMLDivElement;
        }

        if (!postContainer) return;

        // Extract author info
        const authorHeading = postContainer.querySelector('h4');
        const authorText = authorHeading?.textContent?.trim() || "";

        let authorName = "";
        let authorHandle = "";

        if (authorText.includes("@")) {
          const parts = authorText.split("@");
          authorName = parts[0]?.trim().replace(/Verified/g, "").trim() || "";
          authorHandle = parts[1]?.trim() || "";
        }

        // Extract avatar
        const avatarImg = postContainer.querySelector('img[alt*="Profile Picture"]');
        const authorAvatar = avatarImg?.getAttribute("src") ?? undefined;

        // Extract post body - find paragraph elements
        const bodyParagraphs = postContainer.querySelectorAll("p");
        let body = "";
        bodyParagraphs.forEach((p) => {
          const text = p.textContent?.trim();
          if (text && !text.includes("@") && !text.match(/^\d+\s*(hours?|minutes?|days?|ago)/)) {
            body += text + "\n";
          }
        });
        body = body.trim();

        // Extract timestamp
        const timeLink = postContainer.querySelector('a[href*="/status/"]');
        const timeText = timeLink?.textContent?.trim() || "";

        // Extract engagement metrics - look for links with numbers
        const metricLinks = postContainer.querySelectorAll('a[href="#"]');
        let replies = 0, likes = 0;

        metricLinks.forEach((link, index) => {
          const text = link.textContent?.trim() || "";
          const count = parseEngagementCount(text);

          // Typically in order: replies, retweets, likes, views, bookmarks
          if (index === 0) replies = count;
          else if (index === 2) likes = count;
        });

        // Extract media
        const mediaImg = postContainer.querySelector('img[alt*="tweet picture"]');
        const mediaVideo = postContainer.querySelector('a[href*=".mp4"]');

        let mediaUrl: string | undefined;
        let mediaType: "image" | "video" | undefined;

        if (mediaVideo) {
          mediaUrl = mediaVideo.getAttribute("href") || undefined;
          mediaType = "video";
        } else if (mediaImg) {
          mediaUrl = mediaImg.getAttribute("src") || undefined;
          mediaType = "image";
        }

        if (body || mediaUrl) {
          posts.push({
            apiId: postId,
            body: body,
            authorName: authorName,
            authorApiId: authorHandle,
            authorAvatar: authorAvatar,
            publishedDate: timeText, // We could convert this to ISO format
            pluginId: pluginName,
            url: mediaUrl,
            thumbnailUrl: mediaType === "image" ? mediaUrl : undefined,
            score: likes,
            numOfComments: replies,
            originalUrl: `https://twitter.com/i/status/${postId}`,
          });
        }
      } catch (error) {
        console.error("Error parsing post:", error);
      }
    });

    return posts;
  }
}

export const twitter = new TwitterService();
