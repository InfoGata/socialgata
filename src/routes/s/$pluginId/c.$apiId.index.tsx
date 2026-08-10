import CommunityFeed from "@/components/CommunityFeed";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, apiId } = Route.useParams();
  const { q } = Route.useSearch();

  return (
    <CommunityFeed
      posts={data.items}
      pluginId={pluginId}
      pageInfo={data.pageInfo}
      apiId={apiId}
      community={data.community}
      sortOptions={data.sortOptions}
      sortId={data.sortId}
      timeRangeId={data.timeRangeId}
      query={q}
    />
  );
};

type CommunitySearch = {
  page?: string | number;
  sortId?: string;
  timeRangeId?: string;
  q?: string;
}

export const Route = createFileRoute("/s/$pluginId/c/$apiId/")({
  params: pluginIdParams<{ apiId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: Community,
  loaderDeps: ({search}) => ({page: search.page, sortId: search.sortId, timeRangeId: search.timeRangeId, q: search.q}),
  loader: async ({ params, deps: { page, sortId, timeRangeId, q }, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (!plugin) throw notFound();

    // A query scopes the listing to a search within this community, when the
    // plugin supports it; otherwise fall through to the normal listing.
    if (q && await plugin.hasDefined.onSearchCommunity()) {
      return plugin.remote.onSearchCommunity({
        query: q,
        communityApiId: params.apiId,
        pageInfo: { page: page },
        sortId,
        timeRangeId,
      });
    }

    if (await plugin.hasDefined.onGetCommunity()) {
      const response = await plugin.remote.onGetCommunity({
        apiId: params.apiId,
        pageInfo: { page: page },
        sortId,
        timeRangeId,
      });
      return response;
    }

    throw notFound();
  },
  validateSearch: (search: Record<string, unknown>): CommunitySearch => {
    const page = search.page as string | number | undefined;
    const sortId = search.sortId as string | undefined;
    const timeRangeId = search.timeRangeId as string | undefined;
    const q = search.q as string | undefined;
    return {page, sortId, timeRangeId, q};
  }
});
