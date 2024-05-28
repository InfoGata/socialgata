export interface ServiceType {
  getHome(accessToken: string): void;
  getCommunity(accessToken: string, apiId: string): void;
  getComments(accessToken: string, communityId: string, apiId: string): void;
  getUser(accessToken: string, apiId: string): void;
}
