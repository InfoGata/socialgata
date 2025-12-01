import CommunityFeed from "@/components/CommunityFeed";
import { createFileRoute, notFound } from "@tanstack/react-router";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId } = Route.useParams();

  return <CommunityFeed posts={data.items} pluginId={pluginId} pageInfo={data.pageInfo} community={data.community} />;
};

type CommunitySearch = {
  page?: string | number;
}

export const Route = createFileRoute("/plugins/$pluginId/community/$apiId/")({
  component: Community,
  loaderDeps: ({search}) => ({page: search.page}),
  loader: async ({ params, deps: { page }, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetCommunity()) {
      const response = await plugin.remote.onGetCommunity({
        apiId: params.apiId,
        pageInfo: { page: page },
      });
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): CommunitySearch => {
    const page = search.page as string | number | undefined;
    return {page};
  }
});
