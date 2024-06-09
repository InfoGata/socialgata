import { GetCommentsResponse, GetCommunityResponse, GetHomeResponse, GetUserReponse, Post } from "@/plugintypes";
import { ServiceType } from "@/types";
import { GetComments, GetPersonDetails, GetPosts, LemmyHttp, PostView } from "lemmy-js-client";

const pluginName = "lemmy";
const baseUrl = "https://lemmy.ml";

const lemmyPostToPost = (postView: PostView): Post => {
  return {
    title: postView.post.name,
    apiId: postView.post.id.toString(),
    communityName: postView.community.name,
    communityApiId: postView.community.name,
    counts: {
      upvotes: postView.counts.upvotes,
      comments: postView.counts.comments,
    },
    authorApiId: postView.creator.name,
    authorName: postView.creator.name,
    pluginId: pluginName,
    originalUrl: postView.post.ap_id,
    publishedDate: postView.post.published,
    url: postView.post.url,
    thumbnail_url: postView.post.thumbnail_url,
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


class LemmyService implements ServiceType {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getFeed(): Promise<GetHomeResponse> {
    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const perPage = 30;
    const page = 1;

    const form: GetPosts = {
      type_: "Local",
      sort: "Active",
      limit: perPage,
      page: page
    }

    const postsResponse = await client.getPosts(form);
    const items = postsResponse.posts.map(lemmyPostToPost);
    return {
      items
    }
  }

  async getCommunity(apiId: string): Promise<GetCommunityResponse> {
    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const perPage = 30;
    const page = 1;
    const communityResponse = await client.getCommunity({ name: apiId });

    const form: GetPosts = {
      sort: "Active",
      limit: perPage,
      page: page,
      community_name: apiId
    }
    const postsResponse = await client.getPosts(form);
    return {
      community: {
        apiId: apiId,
        name: communityResponse.community_view.community.name,
      },
      items: postsResponse.posts.map(lemmyPostToPost)
    }
  }

  async getComments(_communityId: string, apiId: string): Promise<GetCommentsResponse> {
    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const form: GetComments = {
      post_id: Number(apiId)
    }

    const commentsResponse = await client.getComments(form);

    const items = commentsResponse.comments.map((c):Post => ({
      body: c.comment.content,
      authorApiId: c.creator.id.toString(),
      authorName: c.creator.name,
      authorAvatar: c.creator.avatar,
      apiId: c.comment.id.toString(),
      pluginId: pluginName,
      counts: {
        upvotes: c.counts.score,
        comments: c.counts.child_count
      },
      originalUrl: c.comment.ap_id
    }));


    return {
      items
    }
  }

  async getUser(apiId: string): Promise<GetUserReponse> {

    const client = new LemmyHttp(baseUrl, { fetchFunction: proxyFetch });
    const perPage = 30;
    const page = 1;
    const form: GetPersonDetails = {
      username: apiId,
      limit: perPage,
      page: page,
      sort: "New",
    };
    const userResponse = await client.getPersonDetails(form);
    return {
      user: {
        apiId: apiId,
        name: userResponse.person_view.person.name,
      },
      items: userResponse.posts.map(lemmyPostToPost),
    };

  }
}


export const lemmy = new LemmyService();