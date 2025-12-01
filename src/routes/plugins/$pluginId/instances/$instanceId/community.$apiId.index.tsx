import CommunityFeed from "@/components/CommunityFeed";
import { createFileRoute, notFound } from "@tanstack/react-router";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, instanceId } = Route.useParams();

  return (
    <CommunityFeed
      posts={data.items}
      pluginId={pluginId}
      instanceId={instanceId}
      community={data.community}
      pageInfo={data.pageInfo}
    />
  );
};

export const Route = createFileRoute("/plugins/$pluginId/instances/$instanceId/community/$apiId/")({
  component: Community,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetCommunity()) {
      const response = await plugin.remote.onGetCommunity({
        apiId: params.apiId,
        instanceId: params.instanceId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
