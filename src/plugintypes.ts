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
  instanceId?: string;
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
  instanceId?: string;
}

export interface Community {
  apiId: string;
  name: string;
  instanceId?: string;
}

export interface Instance {
  name: string;
  description: string;
  url: string;
  apiId: string;
  iconUrl?: string;
  bannerUrl?: string;
  usersCount?: number;
  postsCount?: number;
  commentsCount?: number;
}

export interface GetInstancesRequest {
  pageInfo?: PageInfo;
}

export interface GetInstancesResponse {
  instances: Instance[];
  pageInfo?: PageInfo;
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
  instanceId?: string;
  feedTypeId?: string;
}

export interface GetFeedResponse {
  pageInfo?: PageInfo;
  items: Post[];
  feedTypes?: FeedType[];
  feedTypeId?: string;
  instance?: Instance;
}

export interface FeedType {
  displayName: string;
  id: string;
} 

export interface GetCommunityRequest {
  apiId: string;
  instanceId?: string;
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

export interface GetUserRequest {
  apiId: string;
  instanceId?: string;
}

export interface GetCommentsRequest {
  communityId?: string;
  apiId?: string;
  instanceId?: string;
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

export type Theme = "light" | "dark" | "system";