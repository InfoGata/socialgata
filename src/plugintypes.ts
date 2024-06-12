export interface Post {
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
  resultsPerPage: number;
  offset: number;
  nextPage?: string;
  prevPage?: string;
}


export interface GetHomeResponse {
  page?: PageInfo;
  items: Post[];
}

export interface GetCommunityResponse {
  page?: PageInfo;
  community?: Community;
  items: Post[];
}


export interface GetUserReponse {
  page?: PageInfo;
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
  page?: PageInfo;
}

export type ListingType = "comment" | "post";

export interface LoginRequest {
  apiKey: string;
  apiSecret: string;
}