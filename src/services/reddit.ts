import { GetCommentsRequest, GetCommentsResponse, GetCommunityRequest, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetUserReponse, GetUserRequest, LoginRequest, Post, SearchRequest, SearchResponse } from "@/plugintypes";
import { ServiceType } from "@/types";

const pluginName = "reddit";
const REDDIT_API_BASE = "https://oauth.reddit.com";
const REDDIT_PUBLIC_API_BASE = "https://www.reddit.com";

type RedditResponse = Listing;

interface Listing {
  kind: "Listing";
  data?: ListingData;
}

interface ListingData {
  after: string;
  before: string | null;
  dist: number;
  children: (ListingChildPost | ListingChildComment | ListingMore)[];
}

interface ListingChildPost {
  kind: "t3";
  data: ListingChildPostData
}

interface ListingChildComment {
  kind: "t1";
  data: ListingChildCommentData;
}

interface ListingMore {
  kind: "more";
  data: ListingMoreData;
}

interface ListingMoreData {
  count: number;
  parent_id: string;
  name: string;
  id: string;
  children: string[];
}


interface ListingChildCommentData {
  author: string;
  body: string;
  body_html: string;
  created: number;
  created_utc: number;
  depth: number;
  replies?: Listing;
  id: string;
}

interface ListingChildPostData {
  approved_at_utc: string | null;
  subreddit: string;
  selftext: string;
  author_fullname: string;
  saved: boolean;
  mod_reason_title: string | null;
  gilded: number;
  clicked: boolean;
  title: string;
  name: string;
  created: number;
  link_flair_richtext: Array<string>;
  subreddit_name_prefixed: string;
  hidden: boolean;
  pwls: number;
  link_flair_css_class: boolean;
  downs: number;
  thumbnail_height: boolean;
  top_awarded_type: boolean;
  hide_score: boolean;
  quarantine: boolean;
  link_flair_text_color: string;
  upvote_ratio: number;
  author_flair_background_color: string | null;
  subreddit_type: string;
  ups: number;
  total_awards_received: number;
  media_embed: object;
  thumbnail_width: number | null;
  author_flair_template_id: string | null;
  is_original_content: boolean;
  user_reports: Array<string>;
  secure_media: string | null;
  is_reddit_media_domain: boolean;
  is_meta: boolean;
  category: string | null;
  secure_media_embed: object;
  link_flair_text: string | null;
  can_mod_post: boolean;
  score: number;
  approved_by: string | null;
  is_created_from_ads_ui: boolean;
  author_premium: boolean;
  thumbnail: string;
  edited: boolean;
  author_flair_css_class: string | null;
  author_flair_richtext: Array<string>;
  gildings: object;
  content_categories: string | null;
  is_self: boolean;
  mod_note: string | null;
  link_flair_type: string;
  wls: number;
  removed_by_category: string | null;
  banned_by: string | null;
  author_flair_type: string;
  domain: string;
  allow_live_comments: boolean;
  selftext_html: string;
  likes: string | null;
  suggested_sort: string | null;
  banned_at_utc: string | null;
  view_count: string | null;
  archived: boolean;
  no_follow: boolean;
  is_crosspostable: boolean;
  pinned: boolean;
  over_18: boolean;
  all_awardings: Array<string>;
  awarders: Array<string>;
  media_only: boolean;
  can_gild: boolean;
  spoiler: boolean;	
  locked: boolean;
  author_flair_text: string | null;
  treatment_tags: Array<string>;
  visited: boolean;
  removed_by: string | null;
  num_reports: string | null;
  distinguished: string | null;
  subreddit_id: string;
  author_is_blocked: boolean;
  mod_reason_by: string | null;
  removal_reason: string | null;
  link_flair_background_color: string;
  id: string;
  is_robot_indexable: boolean;
  report_reasons: string | null;
  author: string;
  discussion_type: string | null;
  num_comments: 1;
  send_replies: boolean;
  whitelist_status: string;
  contest_mode: boolean;
  mod_reports: Array<string>;
  author_patreon_flair: boolean;
  author_flair_text_color: string | null;
  permalink: string;
  parent_whitelist_status: string;
  stickied: boolean;
  url: string;
  subreddit_subscribers: number;
  created_utc: number;
  num_crossposts: number;
  media: string | null;
  is_video: boolean;
}

interface CommentsResponse {
  0: { kind: "Listing"; data: { children: ListingChildPost[] } };
  1: Listing;
}

interface UserResponse {
  kind: "Listing";
  data: ListingData;
}

const redditPostsToPost = (post: ListingChildPostData): Post => {
  return {
    apiId: post.id,
    title: post.title,
    numOfComments: post.num_comments,
    score: post.score,
    authorName: post.author,
    authorApiId: post.author,
    communityName: post.subreddit,
    communityApiId: post.subreddit,
    body: post.selftext,
    pluginId: pluginName,
    thumbnailUrl: post.thumbnail === "self" ? undefined : post.thumbnail,
    url: post.thumbnail === "self" ? undefined : post.url,
  }
}

const redditCommentToPost = (comment: ListingChildCommentData): Post => {
  return {
    apiId: comment.id,
    body: comment.body,
    authorName: comment.author,
    authorApiId: comment.author,
    pluginId: pluginName,
    comments: comment.replies?.data?.children
      .filter((c): c is ListingChildComment => c.kind === "t1")
      .map(c => redditCommentToPost(c.data)) ?? [],
    moreRepliesId: comment.replies?.data?.children
      .find((c): c is ListingMore => c.kind === "more")?.data?.id,
    moreRepliesCount: comment.replies?.data?.children
      .find((c): c is ListingMore => c.kind === "more")?.data?.count
  }
}


class RedditService implements ServiceType {
  private accessToken = "";

  private getBaseUrl = () => {
    if (this.hasLogin()) {
      return REDDIT_API_BASE;
    } else {
      // return `${this.corsProxy}${REDDIT_PUBLIC_API_BASE}`;
      return `${REDDIT_PUBLIC_API_BASE}`;
    }
  }

  private getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      "Accept": "application/json",
    }
    if (this.hasLogin()) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  getFeed = async (request?: GetFeedRequest): Promise<GetFeedResponse> => {
    const headers = this.getHeaders();
    const baseUrl = this.getBaseUrl();
    const path = "/hot.json";
    
    // Build URL with pagination parameters
    const url = new URL(`${baseUrl}${path}`);
    if (request?.pageInfo?.page) {
      url.searchParams.append("after", String(request.pageInfo.page));
    }

    const response = await fetch(url.toString(), {
      headers
    });
    const json: RedditResponse = await response.json();
    const items = json.data?.children
      .filter((c): c is ListingChildPost => c.kind === "t3")
      .map(c => redditPostsToPost(c.data)) ?? [];
    return { items, pageInfo: { nextPage: json.data?.after ?? undefined, prevPage: json.data?.before ?? undefined } }
  };

  getCommunity = async (request: GetCommunityRequest): Promise<GetCommunityResponse> => {
    const headers = this.getHeaders();
    const baseUrl = this.getBaseUrl();
    const path = `/r/${request.apiId}/hot.json`;
    const response = await fetch(`${baseUrl}${path}`, {
      headers
    });
    const json: RedditResponse = await response.json();
    const items = json.data?.children
      .filter((c): c is ListingChildPost => c.kind === "t3")
      .map(c => redditPostsToPost(c.data)) ?? [];
    return {
      items,
      pageInfo: { nextPage: json.data?.after ?? undefined, prevPage: json.data?.before ?? undefined }
    }
  }

  getComments = async (request: GetCommentsRequest): Promise<GetCommentsResponse> => {
    const headers = this.getHeaders();
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/r/${request.communityId}/comments/${request.apiId}.json`;
    const response = await fetch(url, {
      headers 
    });
    const json: CommentsResponse = await response.json();
    const items = json[1].data?.children
      .filter((c): c is ListingChildComment => c.kind === "t1")
      .map(c => redditCommentToPost(c.data)) ?? [];
    const post = json[0].data.children
      .filter((c): c is ListingChildPost => c.kind === "t3")
      .map(c => redditPostsToPost(c.data))[0];
    const more = json[1].data?.children
      .find((c): c is ListingMore => c.kind === "more")?.data;
    post.moreRepliesId = more?.id;
    post.moreRepliesCount = more?.count;
    return {
      items,
      post
    }
  }

  getUser = async (request: GetUserRequest): Promise<GetUserReponse> => {
    const headers = this.getHeaders();
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/user/${request.apiId}/overview.json`;
    const response = await fetch(url, {
      headers
    });
    const json: UserResponse = await response.json();
    const items = json.data.children
      .map((c): Post => {
        if (c.kind === "t1") return redditCommentToPost(c.data);
        if (c.kind === "t3") return redditPostsToPost(c.data);
        throw new Error(`Unexpected kind: ${c.kind}`);
      });
    return {
      items
    }
  }

  search = async (request: SearchRequest): Promise<SearchResponse> => {
    const headers = this.getHeaders();
    const baseUrl = this.getBaseUrl();
    const path = "/search.json";
    
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.append("q", request.query);
    url.searchParams.append("type", "link");
    if (request.pageInfo?.page) {
      url.searchParams.append("after", String(request.pageInfo.page));
    }

    const response = await fetch(url.toString(), {
      headers
    });
    const json: RedditResponse = await response.json();
    const items = json.data?.children
      .filter((c): c is ListingChildPost => c.kind === "t3")
      .map(c => redditPostsToPost(c.data)) ?? [];
    
    return { 
      items, 
      pageInfo: { 
        nextPage: json.data?.after ?? undefined, 
        prevPage: json.data?.before ?? undefined 
      } 
    }
  }

  async logout(): Promise<void> {
    this.accessToken = "";
  }

  hasLogin = () => {
    return !!this.accessToken;
  }

  async isLoggedIn(): Promise<boolean> {
    return this.hasLogin();
  }

  login = (request: LoginRequest): Promise<void> => {
    return new Promise((resolve) => {
      const tokenUrl = "https://www.reddit.com/api/v1/access_token";
      const redirectUri = `${window.location.origin}/login_popup.html`;
      const authUrl = "https://www.reddit.com/api/v1/authorize";
      const responseType = "code";
      const state = "12345";
      const scope = "read history";
      const duration = "permanent";
      const url = new URL(authUrl);
      url.searchParams.append("redirect_uri", redirectUri);
      url.searchParams.append("client_id", request.apiKey);
      url.searchParams.append("state", state);
      url.searchParams.append("response_type", responseType);
      url.searchParams.append("duration", duration);
      url.searchParams.append("scope", scope);
      const newWindow = window.open(url);

      const onMessage = async (returnUrl: string) => {
        const codeUrl = new URL(returnUrl);
        const code = codeUrl.searchParams.get("code");
        if (code) {
          const auth = btoa(`${request.apiKey}:${request.apiSecret}`);
          const params = new URLSearchParams();
          params.append("code", code);
          params.append("grant_type", "authorization_code");
          params.append("redirect_uri", redirectUri);
          const response = await fetch(tokenUrl, {
            method: "POST",
            body: params.toString(),
            headers: {
              "Content-type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${auth}`,
            },
          });
          const json = await response.json();
          this.accessToken = json.access_token;
          resolve();
        }
        if (newWindow) {
          newWindow.close();
        }
      };

      window.onmessage = (event: MessageEvent) => {
        if (event.source == newWindow) {
          onMessage(event.data.url);
        }
      };
    });
  }
}

export const reddit = new RedditService();