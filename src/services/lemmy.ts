import { GetCommentsRequest, GetCommentsResponse, GetCommunityRequest, GetCommunityResponse, GetFeedRequest, GetFeedResponse, GetInstancesRequest, GetInstancesResponse, GetUserReponse, GetUserRequest, Post } from "@/plugintypes";
import { ServiceType } from "@/types";
import { GetComments, GetPersonDetails, GetPosts, LemmyHttp, PostView, Comment } from "lemmy-js-client";
import { Converter } from "showdown";

const markdownConverter = new Converter();
const pluginName = "lemmy";
const baseUrl = "https://lemmy.ml";

function getCommentParentId(comment: Comment): string | undefined {
  const split = comment.path.split(".");
  split?.shift();

  return split && split.length > 1
    ? split.at(split.length - 2)
    : undefined;
}

function buildCommentTree(comments: Post[]): Post[] {
  const map = new Map<string, Post>();
  for (const comment of comments) {
    if (comment.apiId) {
      map.set(comment.apiId, comment);
    }
  }
  const result: Post[] = []
  for (const comment of comments) {
    if (comment.apiId) {
      const child = map.get(comment.apiId)
      const parentId = child?.parentId;
      if (parentId) {
        const parent = map.get(parentId);
        if (parent) {
          parent.comments?.push(comment);
        }
      } else {
        result.push(comment);
      }
    }
  }
  return result;
}

const lemmyPostToPost = (postView: PostView): Post => {
  return {
    title: postView.post.name,
    apiId: postView.post.id.toString(),
    communityName: postView.community.name,
    communityApiId: postView.community.name,
    score: postView.counts.score,
    numOfComments: postView.counts.comments,
    authorApiId: postView.creator.name,
    authorName: postView.creator.name,
    pluginId: pluginName,
    originalUrl: postView.post.ap_id,
    publishedDate: postView.post.published,
    url: postView.post.url,
    thumbnailUrl: postView.post.thumbnail_url,
    authorAvatar: postView.creator.avatar
  };
};

const proxyFetch: typeof fetch = (
  request: RequestInfo | URL,
  init?: RequestInit
) => {
  const proxyUrl = "http://localhost:8085/";
  const requestUrl = `${proxyUrl}${(request.toString())}`;
  return fetch(requestUrl, init);
};

interface LemmyInstance {
  baseurl: string;
  url: string;
  name: string;
  desc: string;
  nsfw: boolean;
  private: boolean;
  open: boolean;
  usage: LemmyInstanceUsage;
  counts: LemmyInstanceCounts;
  banner?: string;
  icon?: string;
  langs: string[];
  date: string;
  published: number;
  score: number;
}

interface LemmyInstanceUsage {
  localPosts: number;
  localComments: number;
  users: LemmyInstanceUsageUsers;
}

interface LemmyInstanceUsageUsers {
  total: number;
  activeHalfyear: number;
  activeMonth: number;
}

interface LemmyInstanceCounts {
  users: number;
  posts: number;
  comments: number;
  communities: number;
  users_active_half_year: number;
  users_active_month: number;
  users_active_week: number;
  users_active_day: number;
}


class LemmyService implements ServiceType {
  async getFeed(request: GetFeedRequest): Promise<GetFeedResponse> {
    let url = baseUrl;
    if (request.instanceId) {
      // Add protocol to instanceId
      url = `https://${request.instanceId}`;
    }
    const client = new LemmyHttp(url, { fetchFunction: proxyFetch });
    const perPage = 30;
    const page = Number(request.pageInfo?.page || 1);

    const form: GetPosts = {
      type_: "Local",
      sort: "Active",
      limit: perPage,
      page: page
    }

    const postsResponse = await client.getPosts(form);
    const items = postsResponse.posts.map(lemmyPostToPost);
    return {
      items,
      pageInfo: {
        page: page,
        nextPage: postsResponse.next_page,
        prevPage: page > 1 ? page - 1 : undefined
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getInstances(_request?: GetInstancesRequest): Promise<GetInstancesResponse> {
    const url = "https://data.lemmyverse.net/data/instance.full.json";
    const response = await proxyFetch(url);
    const instances: LemmyInstance[] = await response.json();
    // order by score
    instances.sort((a, b) => b.score - a.score);
    return {
      instances: instances.map((i) => ({
        name: i.name,
        description: i.desc,
        url: i.url,
        apiId: i.baseurl,
        iconUrl: i.icon,
        bannerUrl: i.banner,
        usersCount: i.counts.users,
        postsCount: i.counts.posts,
        commentsCount: i.counts.comments
      }))
    }
  }

  async getCommunity(request: GetCommunityRequest): Promise<GetCommunityResponse> {
    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const perPage = 30;
    const page = 1;
    const communityResponse = await client.getCommunity({ name: request.apiId });

    const form: GetPosts = {
      sort: "Active",
      limit: perPage,
      page: page,
      community_name: request.apiId
    }
    const postsResponse = await client.getPosts(form);
    return {
      community: {
        apiId: request.apiId,
        name: communityResponse.community_view.community.name,
      },
      items: postsResponse.posts.map(lemmyPostToPost)
    }
  }

  async getComments(request: GetCommentsRequest): Promise<GetCommentsResponse> {
    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const form: GetComments = {
      type_: "All",
      post_id: Number(request.apiId),
      sort: "Hot",
      saved_only: false,
      max_depth: 8
    }

    const postResponse = await client.getPost({ id: Number(request.apiId) })
    const commentsResponse = await client.getComments(form);

    const posts = commentsResponse.comments.map((c): Post => ({
      body: markdownConverter.makeHtml(c.comment.content),
      authorApiId: c.creator.id.toString(),
      authorName: c.creator.name,
      authorAvatar: c.creator.avatar,
      apiId: c.comment.id.toString(),
      pluginId: pluginName,
      score: c.counts.score,
      numOfComments: c.counts.child_count,
      originalUrl: c.comment.ap_id,
      publishedDate: c.comment.published,
      parentId: getCommentParentId(c.comment),
      comments: []
    }));

    const items = buildCommentTree(posts);

    return {
      items,
      post: lemmyPostToPost(postResponse.post_view),
      community: {
        apiId: request.communityId || "",
        name: postResponse.community_view.community.name,
      },
    }
  }

  async getUser(request: GetUserRequest): Promise<GetUserReponse> {

    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const perPage = 30;
    const page = 1;
    const form: GetPersonDetails = {
      username: request.apiId,
      limit: perPage,
      page: page,
      sort: "New",
    };
    const userResponse = await client.getPersonDetails(form);
    return {
      user: {
        apiId: request.apiId,
        name: userResponse.person_view.person.name,
      },
      items: userResponse.posts.map(lemmyPostToPost),
    };

  }
}


export const lemmy = new LemmyService();