import CommunityFeed from "@/components/CommunityFeed";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId } = Route.useParams();

  return <CommunityFeed posts={data.items} pluginId={pluginId} pageInfo={data.pageInfo} />;
};

type CommunitySearch = {
  page?: string | number;
}

export const Route = createFileRoute("/plugins/$pluginId/community/$apiId/")({
  component: Community,
  loaderDeps: ({search}) => ({page: search.page}),
  loader: async ({ params, deps: { page } }) => {
    const service = getService(params.pluginId);
    if (service && service.getCommunity) {
      const response = await service.getCommunity({
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
