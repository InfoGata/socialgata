import { ServiceType, PlatformType } from "@/types";
import {
  GetFeedRequest,
  GetFeedResponse,
  GetCommunitiesRequest,
  GetCommunitiesResponse,
  GetCommunityRequest,
  GetCommunityResponse,
  GetCommentsRequest,
  GetCommentsResponse,
  GetCommentRepliesRequest,
  GetCommentRepliesResponse,
  GetUserRequest,
  GetUserReponse,
  SearchRequest,
  SearchResponse,
  GetTrendingTopicsRequest,
  GetTrendingTopicsResponse,
  GetTrendingTopicFeedRequest,
  GetTrendingTopicFeedResponse,
  GetInstancesRequest,
  GetInstancesResponse,
  LoginRequest,
} from "../plugintypes";
import { PluginFrameContainer } from "../contexts/PluginsContext";

/**
 * Adapter that wraps a PluginFrameContainer to implement the ServiceType interface.
 * This allows dynamic plugins to work with the existing routing and UI code.
 */
export class PluginServiceAdapter implements ServiceType {
  platformType: PlatformType;

  constructor(private plugin: PluginFrameContainer) {
    this.platformType = plugin.platformType || "forum";
  }

  async getInstances(request?: GetInstancesRequest): Promise<GetInstancesResponse> {
    if (await this.plugin.hasDefined.onGetInstances()) {
      return this.plugin.remote.onGetInstances(request);
    }
    return { instances: [] };
  }

  async getFeed(request?: GetFeedRequest): Promise<GetFeedResponse> {
    if (await this.plugin.hasDefined.onGetFeed()) {
      return this.plugin.remote.onGetFeed(request);
    }
    return { items: [] };
  }

  async getCommunity(request: GetCommunityRequest): Promise<GetCommunityResponse> {
    if (await this.plugin.hasDefined.onGetCommunity()) {
      return this.plugin.remote.onGetCommunity(request);
    }
    return { items: [] };
  }

  async getCommunities(request: GetCommunitiesRequest): Promise<GetCommunitiesResponse> {
    if (await this.plugin.hasDefined.onGetCommunities()) {
      return this.plugin.remote.onGetCommunities(request);
    }
    return { items: [] };
  }

  async getComments(request: GetCommentsRequest): Promise<GetCommentsResponse> {
    if (await this.plugin.hasDefined.onGetComments()) {
      return this.plugin.remote.onGetComments(request);
    }
    return { items: [] };
  }

  async getCommentReplies(request: GetCommentRepliesRequest): Promise<GetCommentRepliesResponse> {
    if (await this.plugin.hasDefined.onGetCommentReplies()) {
      return this.plugin.remote.onGetCommentReplies(request);
    }
    return { items: [] };
  }

  async getUser(request: GetUserRequest): Promise<GetUserReponse> {
    if (await this.plugin.hasDefined.onGetUser()) {
      return this.plugin.remote.onGetUser(request);
    }
    return { items: [] };
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    if (await this.plugin.hasDefined.onSearch()) {
      return this.plugin.remote.onSearch(request);
    }
    return { items: [] };
  }

  async getTrendingTopics(request?: GetTrendingTopicsRequest): Promise<GetTrendingTopicsResponse> {
    if (await this.plugin.hasDefined.onGetTrendingTopics()) {
      return this.plugin.remote.onGetTrendingTopics(request);
    }
    return { items: [] };
  }

  async getTrendingTopicFeed(request: GetTrendingTopicFeedRequest): Promise<GetTrendingTopicFeedResponse> {
    if (await this.plugin.hasDefined.onGetTrendingTopicFeed()) {
      return this.plugin.remote.onGetTrendingTopicFeed(request);
    }
    return { items: [] };
  }

  async login(request: LoginRequest): Promise<void> {
    if (await this.plugin.hasDefined.onLogin()) {
      return this.plugin.remote.onLogin(request);
    }
  }

  async logout(): Promise<void> {
    if (await this.plugin.hasDefined.onLogout()) {
      return this.plugin.remote.onLogout();
    }
  }

  async isLoggedIn(): Promise<boolean> {
    if (await this.plugin.hasDefined.onIsLoggedIn()) {
      return this.plugin.remote.onIsLoggedIn();
    }
    return false;
  }
}
