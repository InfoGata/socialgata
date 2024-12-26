import Feed from '@/components/Feed';
import { PageInfo } from '@/plugintypes';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Instance: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { feedTypeId } = Route.useSearch();

  return (
    <Feed
      feedTypeId={feedTypeId}
      data={data}
      pageInfo={data.pageInfo}
      pluginId={params.pluginId}
    />
  );
}

export const Route = createFileRoute('/plugins/$pluginId/instances/$instanceId/feed')({
  component: Instance,
  loaderDeps: ({search}) => ({pageInfo: search.pageInfo, feedTypeId: search.feedTypeId}),
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getFeed) {
      const response = await service.getFeed({instanceId: params.instanceId});
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): {pageInfo?: PageInfo, feedTypeId?: string} => {
    const pageInfo = search.pageInfo as PageInfo | undefined;
    const feedTypeId = search.feedTypeId as string | undefined;
    return {pageInfo, feedTypeId};
  }
})