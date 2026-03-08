import Feed from '@/components/Feed';
import { createFileRoute, notFound } from '@tanstack/react-router'

const InstanceFeed: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { feedTypeId } = Route.useSearch();

  return (
    <Feed
      feedTypeId={feedTypeId}
      data={data}
      pageInfo={data.pageInfo}
      pluginId={params.pluginId}
      instanceId={params.instanceId}
    />
  );
}

export const Route = createFileRoute('/plugins/$pluginId/instances/$instanceId/feed')({
  component: InstanceFeed,
  loaderDeps: ({search}) => ({page: search.page, feedTypeId: search.feedTypeId}),
  loader: async ({ params, deps: { page, feedTypeId }, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetFeed()) {
      const response = await plugin.remote.onGetFeed({
        instanceId: params.instanceId,
        pageInfo: { page },
        feedTypeId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): {page?: string | number, feedTypeId?: string} => {
    const page = search.page as string | number | undefined;
    const feedTypeId = search.feedTypeId as string | undefined;
    return { page, feedTypeId };
  }
})