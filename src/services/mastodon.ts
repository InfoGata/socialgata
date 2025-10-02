import { createRestAPIClient } from "masto";
import { ServiceType } from "../types";
import { Post, GetUserReponse, GetFeedResponse, GetUserRequest, GetTrendingTopicsRequest, GetTrendingTopicsResponse, TrendingTopic, GetTrendingTopicFeedRequest, GetTrendingTopicFeedResponse } from "../plugintypes";

const pluginName = "mastodon";
const baseUrl = "https://mastodon.social";
const masto = createRestAPIClient({ url: baseUrl });
const func = masto.v1.timelines.public.list;
type Status = Awaited<ReturnType<typeof func>>[0];

const statusToPost = (status: Status): Post => {
  return {
    apiId: status.id,
    body: status.content,
    authorName: status.account.displayName,
    authorApiId: status.account.id,
    score: status.favouritesCount,
    numOfComments: status.repliesCount,
    publishedDate: status.createdAt,
    pluginId: pluginName
  };
};

class MastodonService implements ServiceType {
  platformType = "microblog" as const;

  async getFeed(): Promise<GetFeedResponse> {
    const timelines = await masto.v1.timelines.public.list({ limit: 30 });
    const items: Post[] = timelines.map(statusToPost);
    return {
      items
    };
  }

  async getUser(request: GetUserRequest): Promise<GetUserReponse> {
    const statuses = await masto.v1.accounts.$select(request.apiId).statuses.list({ limit: 30});
    const items = statuses.map(statusToPost);
    return {
      user: {
        apiId: request.apiId,
        name: request.apiId
      },
      items
    };
  }

  async getTrendingTopics(request?: GetTrendingTopicsRequest): Promise<GetTrendingTopicsResponse> {
    const limit = request?.limit ?? 10;

    const trends = await masto.v1.trends.tags.list({ limit });

    const items: TrendingTopic[] = trends.map(tag => ({
      name: tag.name,
      url: tag.url,
      history: tag.history?.map(h => ({
        day: h.day,
        uses: h.uses,
        accounts: h.accounts
      }))
    }));

    return {
      items
    };
  }

  async getTrendingTopicFeed(request: GetTrendingTopicFeedRequest): Promise<GetTrendingTopicFeedResponse> {
    const tag = request.topicName.replace('#', '');
    const limit = 30;

    const statuses = await masto.v1.timelines.tag.$select(tag).list({ limit });
    const items = statuses.map(statusToPost);

    return {
      items,
      topic: {
        name: request.topicName
      }
    };
  }
}

export const mastodon = new MastodonService();
