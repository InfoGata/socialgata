import React from "react";
import { LinkOptions } from "@tanstack/react-router";
import { GetCommentRepliesRequest, GetCommentRepliesResponse, GetCommentsRequest, GetCommentsResponse, GetCommunitiesRequest, GetCommunitiesResponse, GetCommunityRequest, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetInstancesRequest, GetInstancesResponse, GetTrendingTopicFeedRequest, GetTrendingTopicFeedResponse, GetTrendingTopicsRequest, GetTrendingTopicsResponse, GetUserResponse, GetUserRequest, LoginRequest, ManifestAuthentication, SearchRequest, SearchResponse, SearchCommunityRequest, SearchCommunityResponse } from "./plugintypes";
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
  /**
   * The plugin's declared siteMatch patterns. The extension sends credentials
   * (cookies) for requests whose URL matches one of these patterns, so they
   * behave like the site would in a normal browser tab (scoped credential
   * access).
   */
  siteMatchPatterns?: string[];
  /**
   * The plugin's declared `pageContextRequests` patterns. A matching request is
   * issued from a hidden page on the target site rather than from the app, for
   * sites that answer on the request's origin rather than on its headers.
   */
  pageContextPatterns?: string[];
}

export interface RedirectPatternRule {
  pattern: string;
  redirectPath: string;
}

export interface SiteRedirectRule {
  pluginId: string;
  pluginName: string;
  appName: string;
  appOrigin: string;
  siteMatchPatterns: string[];
  redirectPath: string;
  patternRedirects?: RedirectPatternRule[];
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
  registerRedirects?: (rules: SiteRedirectRule[]) => void;
}

/**
 * A response fetched from a page on the target site, relayed by the desktop
 * build's main process. Bodies come back as text because these requests exist
 * for html pages that a site will only serve to its own origin.
 */
export interface PageContextResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

export interface PageContextInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/** Exposed by the Electron preload; absent in the browser and on mobile. */
export interface DesktopApi {
  pageContextFetch(
    url: string,
    init?: PageContextInit
  ): Promise<PageContextResponse>;
}

declare global {
  interface Window {
    InfoGata?: InfoGataExtension;
    api?: DesktopApi;
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
  getUser?(request: GetUserRequest): Promise<GetUserResponse>;
  search?(request: SearchRequest): Promise<SearchResponse>;
  searchCommunity?(request: SearchCommunityRequest): Promise<SearchCommunityResponse>;
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
  icon: React.JSX.Element;
}

export interface PluginDescription {
  id: string;
  name: string;
  url?: string;
  description?: string;
  preinstall?: boolean;
  requiresCorsDisabled?: boolean;
  /**
   * The plugin only works on a host that can fetch from a page on the site it
   * reads (a plugin manifest's `pageContextRequests`). Hidden elsewhere, since
   * installing it there yields a plugin that fails every request.
   */
  requiresPageContext?: boolean;
  /**
   * The plugin needs `requiresCorsDisabled` only for anonymous reading; signing
   * in gives it an api that a plain browser can reach. Reddit is the case:
   * oauth.reddit.com sends CORS headers and never touches the endpoints that
   * get blocked, while the anonymous json endpoints do both.
   *
   * Such a plugin is offered everywhere rather than hidden without the
   * extension -- hiding it would mean the reader can't install the plugin they
   * would need in order to sign in, which is the very thing that makes it work.
   * The card says so, since without either the extension or an account the
   * feeds will error.
   */
  signInReplacesCorsRequirement?: boolean;
}