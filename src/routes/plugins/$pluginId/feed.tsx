import Feed from '@/components/Feed';
import { PageInfo } from '@/plugintypes';
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

export const Route = createFileRoute('/plugins/$pluginId/feed')({
  component: PluginFeed,
  loaderDeps: ({search}) => ({pageInfo: search.pageInfo, feedTypeId: search.feedTypeId}),
  loader: async ({ params, deps: { pageInfo, feedTypeId } }) => {
    const service = getService(params.pluginId);
    if (service && service.getFeed) {
      const response = await service.getFeed({pageInfo: pageInfo, feedTypeId: feedTypeId});
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): {pageInfo?: PageInfo, feedTypeId?: string} => {
    const pageInfo = search as PageInfo | undefined;
    const feedTypeId = search.feedTypeId as string | undefined;
    return {pageInfo, feedTypeId};
  }
});