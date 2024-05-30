import { createRestAPIClient } from "masto";
import { ServiceType } from "../types";
import { Post, GetUserReponse, GetHomeResponse } from "../plugintypes";

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
    counts: { upvotes: status.favouritesCount, comments: status.repliesCount },
    publishedDate: status.createdAt,
    type: "post"
  };
};

class MastodonService implements ServiceType {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getHome(_accessToken: string): Promise<GetHomeResponse> {
    const timelines = await masto.v1.timelines.public.list({ limit: 30 });
    const items: Post[] = timelines.map(statusToPost);
    return {
      items
    };
  }

  async getUser(_accessToken: string, apiId: string): Promise<GetUserReponse> {
    const statuses = await masto.v1.accounts.$select(apiId).statuses.list({ limit: 30});
    const items = statuses.map(statusToPost);
    return {
      user: {
        apiId,
        name: apiId
      },
      items
    };
  }
}

export default MastodonService;