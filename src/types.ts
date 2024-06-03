import { GetCommentsResponse, GetCommunityResponse, GetHomeResponse, GetUserReponse, LoginRequest } from "./plugintypes";

export interface ServiceType {
  getFeed(): Promise<GetHomeResponse>;
  getCommunity?(apiId: string): Promise<GetCommunityResponse>;
  getComments?(communityId: string, apiId: string): Promise<GetCommentsResponse>;
  getUser(apiId: string): Promise<GetUserReponse>;
  login?(request: LoginRequest): Promise<void>;
  logout?(): Promise<void>;
  isLoggedIn?(): Promise<boolean>;
}
