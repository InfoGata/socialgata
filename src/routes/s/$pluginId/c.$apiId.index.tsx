import CommunityFeed from "@/components/CommunityFeed";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId } = Route.useParams();

  return (
    <CommunityFeed
      posts={data.items}
      pluginId={pluginId}
      pageInfo={data.pageInfo}
      community={data.community}
      sortOptions={data.sortOptions}
      sortId={data.sortId}
      timeRangeId={data.timeRangeId}
    />
  );
};

type CommunitySearch = {
  page?: string | number;
  sortId?: string;
  timeRangeId?: string;
}

export const Route = createFileRoute("/s/$pluginId/c/$apiId/")({
  params: pluginIdParams<{ apiId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: Community,
  loaderDeps: ({search}) => ({page: search.page, sortId: search.sortId, timeRangeId: search.timeRangeId}),
  loader: async ({ params, deps: { page, sortId, timeRangeId }, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetCommunity()) {
      const response = await plugin.remote.onGetCommunity({
        apiId: params.apiId,
        pageInfo: { page: page },
        sortId,
        timeRangeId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): CommunitySearch => {
    const page = search.page as string | number | undefined;
    const sortId = search.sortId as string | undefined;
    const timeRangeId = search.timeRangeId as string | undefined;
    return {page, sortId, timeRangeId};
  }
});
