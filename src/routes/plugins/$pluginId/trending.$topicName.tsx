import Feed from '@/components/Feed';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router';

const TrendingTopicFeed: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();

  return (
    <div>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          Trending: {decodeURIComponent(params.topicName)}
        </h1>
      </div>
      <Feed
        data={data}
        pageInfo={data.pageInfo}
        pluginId={params.pluginId}
      />
    </div>
  );
};

type FeedSearch = {
  page?: string | number;
}

export const Route = createFileRoute('/plugins/$pluginId/trending/$topicName')({
  component: TrendingTopicFeed,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, deps: { page } }) => {
    const service = getService(params.pluginId);
    if (service && service.getTrendingTopicFeed) {
      const response = await service.getTrendingTopicFeed({
        topicName: decodeURIComponent(params.topicName),
        pageInfo: { page }
      });
      return response;
    }
    throw notFound();
  },
  validateSearch: (search: Record<string, unknown>): FeedSearch => {
    const page = search.page as string | number | undefined;
    return { page };
  }
});