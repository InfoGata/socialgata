import Feed from '@/components/Feed';
import { createFileRoute, notFound } from '@tanstack/react-router';

const PluginFeed: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const search = Route.useSearch();
  const feedTypeId = search.feedTypeId;

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
  q?: string;
}

export const Route = createFileRoute('/plugins/$pluginId/feed')({
  component: PluginFeed,
  loaderDeps: ({search}) => ({page: search.page, feedTypeId: search.feedTypeId, q: search.q}),
  loader: async ({ params, deps: { page, feedTypeId, q }, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin) {
      // If there's a search query and the plugin supports search, use search
      if (q && await plugin.hasDefined.onSearch()) {
        const response = await plugin.remote.onSearch({
          query: q,
          pageInfo: { page },
        });
        return response;
      }
      // Otherwise, use regular feed
      else if (await plugin.hasDefined.onGetFeed()) {
        const response = await plugin.remote.onGetFeed({
          pageInfo: { page },
          feedTypeId: feedTypeId,
        });
        return response;
      }
    }
    throw notFound();
  },
  validateSearch: (search: Record<string, unknown>): FeedSearch => {
    const page = search.page as string | number | undefined;
    const feedTypeId = search.feedTypeId as string | undefined;
    const q = search.q as string | undefined;
    return { page, feedTypeId, q };
  }
});