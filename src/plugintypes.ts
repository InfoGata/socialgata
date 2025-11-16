export interface Manifest {
  name: string;
  script: string;
  id?: string;
  version?: string;
  description?: string;
  options?: string | ManifestOptions;
  homepage?: string;
  updateUrl?: string;
  authentication?: ManifestAuthentication;
}

export interface ManifestAuthentication {
  loginUrl: string;
  cookiesToFind?: string[];
  loginButton?: string;
  headersToFind?: string[];
  domainHeadersToFind: Record<string, string[]>;
  completionUrl?: string;
}

export interface ManifestOptions {
  page: string;
  sameOrigin?: boolean;
}
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
  moreRepliesId?: string;
  moreRepliesCount?: number;
  isVideo?: boolean;
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
  description?: string;
}

export interface Instance {
  name: string;
  description: string;
  url: string;
  apiId: string;
  iconUrl?: string;
  bannerUrl?: string;
  bannerSvg?: string;
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
  pageInfo?: PageInfo;
}

export interface GetCommunityResponse {
  pageInfo?: PageInfo;
  community?: Community;
  items: Post[];
}

export interface GetCommunitiesRequest {
  instanceId?: string;
  pageInfo?: PageInfo;
}

export interface GetCommunitiesResponse {
  items: Community[];
  pageInfo?: PageInfo;
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

export interface GetCommentRepliesRequest {
  apiId: string;
  communityApiId?: string;
  postApiId?: string;
  instanceId?: string;
}

export interface GetCommentRepliesResponse {
  items: Post[];
  post?: Post;
  pageInfo?: PageInfo;
}

export interface SearchRequest {
  query: string;
  pageInfo?: PageInfo;
  instanceId?: string;
}

export interface SearchResponse {
  items: Post[];
  pageInfo?: PageInfo;
}

export interface TrendingTopic {
  name: string;
  url?: string;
  history?: Array<{
    day: string;
    uses: string;
    accounts: string;
  }>;
}

export interface GetTrendingTopicsRequest {
  instanceId?: string;
  limit?: number;
  offset?: number;
}

export interface GetTrendingTopicsResponse {
  items: TrendingTopic[];
  pageInfo?: PageInfo;
}

export interface GetTrendingTopicFeedRequest {
  topicName: string;
  instanceId?: string;
  pageInfo?: PageInfo;
}

export interface GetTrendingTopicFeedResponse {
  items: Post[];
  pageInfo?: PageInfo;
  topic?: TrendingTopic;
}