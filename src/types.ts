import { LinkOptions } from "@tanstack/react-router";
import { GetCommentsRequest, GetCommentsResponse, GetCommunityRequest, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetInstancesRequest, GetInstancesResponse, GetUserReponse, GetUserRequest, LoginRequest } from "./plugintypes";
import { router } from "./router";

export interface ServiceType {
  getInstances?(request?: GetInstancesRequest): Promise<GetInstancesResponse>;
  getFeed(request?: GetFeedRequest): Promise<GetFeedResponse>;
  getCommunity?(request: GetCommunityRequest): Promise<GetCommunityResponse>;
  getComments?(request: GetCommentsRequest): Promise<GetCommentsResponse>;
  getUser(request: GetUserRequest): Promise<GetUserReponse>;
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