import { BskyAgent, AppBskyFeedDefs } from "@atproto/api";
import { ServiceType } from "@/types";
import {
  GetFeedRequest,
  GetFeedResponse,
  GetUserRequest,
  GetUserReponse,
  LoginRequest,
  Post,
  SearchRequest,
  SearchResponse,
} from "@/plugintypes";

const pluginName = "bluesky";
const BLUESKY_SERVICE_URL = "https://api.bsky.app";

class BlueskyService implements ServiceType {
  platformType = "microblog" as const;
  private agent: BskyAgent;
  private isAuthenticated = false;

  constructor() {
    this.agent = new BskyAgent({ service: BLUESKY_SERVICE_URL });
  }

  private postToPost = (post: AppBskyFeedDefs.PostView): Post => {
    const record = post.record as { text?: string; createdAt?: string } | undefined;
    const embed = post.embed as { external?: { uri?: string; thumb?: string }; images?: Array<{ thumb?: string }> } | undefined;

    return {
      apiId: post.uri,
      body: record?.text || "",
      authorName: post.author?.displayName || post.author?.handle || "",
      authorApiId: post.author?.did || "",
      authorAvatar: post.author?.avatar,
      score: post.likeCount || 0,
      numOfComments: post.replyCount || 0,
      publishedDate: record?.createdAt || post.indexedAt,
      pluginId: pluginName,
      url: embed?.external?.uri,
      thumbnailUrl: embed?.external?.thumb || embed?.images?.[0]?.thumb,
    };
  };

  async getFeed(request?: GetFeedRequest): Promise<GetFeedResponse> {
    try {
      if (this.isAuthenticated) {
        // Get authenticated user's timeline
        const response = await this.agent.getTimeline({
          limit: 30,
          cursor: request?.pageInfo?.page as string | undefined,
        });

        const items: Post[] = response.data.feed.map((item: AppBskyFeedDefs.FeedViewPost) => this.postToPost(item.post));

        return {
          items,
          pageInfo: {
            nextPage: response.data.cursor,
          },
        };
      } else {
        // Get public feed when not authenticated
        // Use a popular feed generator or public timeline
        const response = await this.agent.app.bsky.feed.getFeed({
          feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
          limit: 30,
          cursor: request?.pageInfo?.page as string | undefined,
        });

        const items: Post[] = response.data.feed.map((item: AppBskyFeedDefs.FeedViewPost) => this.postToPost(item.post));

        return {
          items,
          pageInfo: {
            nextPage: response.data.cursor,
          },
        };
      }
    } catch (error) {
      console.error("Error fetching Bluesky feed:", error);
      return { items: [] };
    }
  }

  async getUser(request: GetUserRequest): Promise<GetUserReponse> {
    try {
      const profile = await this.agent.getProfile({ actor: request.apiId });
      const feed = await this.agent.getAuthorFeed({
        actor: request.apiId,
        limit: 30,
      });

      const items: Post[] = feed.data.feed.map((item: AppBskyFeedDefs.FeedViewPost) => this.postToPost(item.post));

      return {
        user: {
          apiId: profile.data.did,
          name: profile.data.displayName || profile.data.handle,
          avatar: profile.data.avatar,
        },
        items,
      };
    } catch (error) {
      console.error("Error fetching Bluesky user:", error);
      return { items: [] };
    }
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      const response = await this.agent.app.bsky.feed.searchPosts({
        q: request.query,
        limit: 30,
        cursor: request.pageInfo?.page as string | undefined,
      });

      const items: Post[] = response.data.posts.map((post: AppBskyFeedDefs.PostView) => this.postToPost(post));

      return {
        items,
        pageInfo: {
          nextPage: response.data.cursor,
        },
      };
    } catch (error) {
      console.error("Error searching Bluesky posts:", error);
      return { items: [] };
    }
  }

  async login(request: LoginRequest): Promise<void> {
    try {
      await this.agent.login({
        identifier: request.apiKey, // Use apiKey as username/handle
        password: request.apiSecret, // Use apiSecret as password
      });
      this.isAuthenticated = true;
    } catch (error) {
      console.error("Error logging into Bluesky:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.isAuthenticated = false;
    this.agent = new BskyAgent({ service: BLUESKY_SERVICE_URL });
  }

  async isLoggedIn(): Promise<boolean> {
    return this.isAuthenticated;
  }
}

export const bluesky = new BlueskyService();
