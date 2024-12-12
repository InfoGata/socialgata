export interface Post {
  number?: number;
  apiId?: string;
  title?: string;
  body?: string;
  publishedDate?: string;
  communityApiId?: string;
  communityName?: string;
  authorApiId?: string;
  authorName?: string;
  authorAvatar?: string;
  pluginId?: string;
  originalUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  parentId?: string;
  comments?: Post[];
  score?: number;
  numOfComments?: number;
}

export interface User {
  apiId: string;
  name: string;
  avatar?: string;
}

export interface Community {
  apiId: string;
  name: string;
}

export interface PageInfo {
  totalResults?: number;
  resultsPerPage?: number;
  offset?: number;
  page?: string | number;
  nextPage?: string | number;
  prevPage?: string | number;
}

export interface GetFeedRequest {
  pageInfo?: PageInfo;
}

export interface GetFeedResponse {
  pageInfo?: PageInfo;
  items: Post[];
}

export interface GetCommunityResponse {
  pageInfo?: PageInfo;
  community?: Community;
  items: Post[];
}


export interface GetUserReponse {
  pageInfo?: PageInfo;
  user?: User;
  items: Post[]
}

export interface GetCommentsRequest {
  communityId?: string;
  apiId?: string;
}

export interface GetCommentsResponse {
  items: Post[];
  post?: Post;
  community?: Community;
  pageInfo?: PageInfo;
}

export type ListingType = "comment" | "post";

export interface LoginRequest {
  apiKey: string;
  apiSecret: string;
}