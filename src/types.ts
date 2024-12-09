import { GetCommentsRequest, GetCommentsResponse, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetUserReponse, LoginRequest } from "./plugintypes";

export interface ServiceType {
  getFeed(request?: GetFeedRequest): Promise<GetFeedResponse>;
  getCommunity?(apiId: string): Promise<GetCommunityResponse>;
  getComments?(request: GetCommentsRequest): Promise<GetCommentsResponse>;
  getUser(apiId: string): Promise<GetUserReponse>;
  login?(request: LoginRequest): Promise<void>;
  logout?(): Promise<void>;
  isLoggedIn?(): Promise<boolean>;
}
