import Feed from '@/components/Feed';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router';

const PluginFeed: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const feedTypeId = Route.useSearch().feedTypeId;
  
  return (
    <Feed
      feedTypeId={feedTypeId}
      data={data}
      pageInfo={data.pageInfo}
      pluginId={params.pluginId}
    />
  );
};

type FeedSearch = {
  page?: string | number;
  feedTypeId?: string;
}

export const Route = createFileRoute('/plugins/$pluginId/feed')({
  component: PluginFeed,
  loaderDeps: ({search}) => ({page: search.page, feedTypeId: search.feedTypeId}),
  loader: async ({ params, deps: { page, feedTypeId } }) => {
    const service = getService(params.pluginId);
    if (service && service.getFeed) {
      const response = await service.getFeed({
        pageInfo: { page },
        feedTypeId: feedTypeId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): FeedSearch => {
    const page = search.page as string | number | undefined;
    const feedTypeId = search.feedTypeId as string | undefined;
    return { page, feedTypeId };
  }
});