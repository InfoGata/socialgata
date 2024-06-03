export interface Post {
  apiId?: string;
  title?: string;
  body?: string;
  publishedDate?: string;
  communityApiId?: string;
  communityName?: string;
  counts: PostCounts;
  authorApiId?: string;
  authorName?: string;
  type: "post";
  pluginId?: string;
}

export interface PostComment {
  apiId?: string;
  body: string;
  authorApiId?: string;
  authorName?: string;
  type: "comment";
  pluginId?: string;
}

export interface PostCounts {
  upvotes: number;
  comments: number;
}

export interface User {
  apiId: string;
  name: string;
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
  items: (Post | PostComment)[]
}

export interface GetCommentsResponse {
  items: PostComment[];
  post?: Post;
  page?: PageInfo;
}

export type ListingType = "comment" | "post";

export interface LoginRequest {
  apiKey: string;
  apiSecret: string;
}