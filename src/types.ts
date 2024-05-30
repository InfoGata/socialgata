import { GetCommentsResponse, GetCommunityResponse, GetHomeResponse, GetUserReponse } from "./plugintypes";

export interface ServiceType {
  getHome(accessToken: string): Promise<GetHomeResponse>;
  getCommunity?(accessToken: string, apiId: string): Promise<GetCommunityResponse>;
  getComments?(accessToken: string, communityId: string, apiId: string): Promise<GetCommentsResponse>;
  getUser(accessToken: string, apiId: string): Promise<GetUserReponse>;
}
