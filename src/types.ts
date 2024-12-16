import { LinkOptions } from "@tanstack/react-router";
import { GetCommentsRequest, GetCommentsResponse, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetUserReponse, LoginRequest } from "./plugintypes";
import { router } from "./router";

export interface ServiceType {
  getFeed(request?: GetFeedRequest): Promise<GetFeedResponse>;
  getCommunity?(apiId: string): Promise<GetCommunityResponse>;
  getComments?(request: GetCommentsRequest): Promise<GetCommentsResponse>;
  getUser(apiId: string): Promise<GetUserReponse>;
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