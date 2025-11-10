import { LinkOptions } from "@tanstack/react-router";
import { GetCommentRepliesRequest, GetCommentRepliesResponse, GetCommentsRequest, GetCommentsResponse, GetCommunityRequest, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetInstancesRequest, GetInstancesResponse, GetTrendingTopicFeedRequest, GetTrendingTopicFeedResponse, GetTrendingTopicsRequest, GetTrendingTopicsResponse, GetUserReponse, GetUserRequest, LoginRequest, ManifestAuthentication, SearchRequest, SearchResponse } from "./plugintypes";
import { router } from "./router";

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

export type PlatformType = "forum" | "microblog" | "imageboard";

export interface ServiceType {
  platformType: PlatformType;
  getInstances?(request?: GetInstancesRequest): Promise<GetInstancesResponse>;
  getFeed(request?: GetFeedRequest): Promise<GetFeedResponse>;
  getCommunity?(request: GetCommunityRequest): Promise<GetCommunityResponse>;
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

export type LinkRouterProps = LinkOptions<typeof router>;

export interface NavigationLinkItem {
  title: string;
  link: LinkRouterProps;
  icon: JSX.Element;
}