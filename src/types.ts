import { LinkOptions } from "@tanstack/react-router";
import { GetCommentRepliesRequest, GetCommentRepliesResponse, GetCommentsRequest, GetCommentsResponse, GetCommunitiesRequest, GetCommunitiesResponse, GetCommunityRequest, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetInstancesRequest, GetInstancesResponse, GetTrendingTopicFeedRequest, GetTrendingTopicFeedResponse, GetTrendingTopicsRequest, GetTrendingTopicsResponse, GetUserReponse, GetUserRequest, LoginRequest, ManifestAuthentication, SearchRequest, SearchResponse } from "./plugintypes";
import { RouterType } from "./router";

export interface NetworkRequest {
  body: Blob | ArrayBuffer | null;
  headers: { [k: string]: string };
  status: number;
  statusText: string;
  url: string;
}

export interface NetworkRequestOptions {
  auth?: ManifestAuthentication;
}

export interface InfoGataExtension {
  networkRequest: (
    input: string,
    init?: RequestInit,
    options?: NetworkRequestOptions
  ) => Promise<NetworkRequest>;
  openLoginWindow?: (
    auth: ManifestAuthentication,
    pluginId: string
  ) => Promise<void>;
  getVersion?: () => Promise<string>;
}

declare global {
  interface Window {
    InfoGata?: InfoGataExtension;
  }
}

export interface DirectoryFile extends File {
  webkitRelativePath: string;
}

export interface PluginAuthentication {
  pluginId: string;
  headers: Record<string, string>;
  domainHeaders?: Record<string, Record<string, string>>;
}

export type PlatformType = "forum" | "microblog" | "imageboard";

export interface ServiceType {
  platformType: PlatformType;
  getInstances?(request?: GetInstancesRequest): Promise<GetInstancesResponse>;
  getFeed(request?: GetFeedRequest): Promise<GetFeedResponse>;
  getCommunity?(request: GetCommunityRequest): Promise<GetCommunityResponse>;
  getCommunities?(request: GetCommunitiesRequest): Promise<GetCommunitiesResponse>;
  getComments?(request: GetCommentsRequest): Promise<GetCommentsResponse>;
  getCommentReplies?(request: GetCommentRepliesRequest): Promise<GetCommentRepliesResponse>;
  getUser?(request: GetUserRequest): Promise<GetUserReponse>;
  search?(request: SearchRequest): Promise<SearchResponse>;
  getTrendingTopics?(request?: GetTrendingTopicsRequest): Promise<GetTrendingTopicsResponse>;
  getTrendingTopicFeed?(request: GetTrendingTopicFeedRequest): Promise<GetTrendingTopicFeedResponse>;
  login?(request: LoginRequest): Promise<void>;
  logout?(): Promise<void>;
  isLoggedIn?(): Promise<boolean>;
}

export type LinkRouterProps = LinkOptions<RouterType>;

export interface NavigationLinkItem {
  title: string;
  link: LinkRouterProps;
  icon: JSX.Element;
}