import CommunityFeed from "@/components/CommunityFeed";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, instanceId } = Route.useParams();

  return <CommunityFeed posts={data} pluginId={pluginId} instanceId={instanceId} />;
};

export const Route = createFileRoute("/plugins/$pluginId/instances/$instanceId/community/$apiId/")({
  component: Community,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getCommunity) {
      const response = await service.getCommunity({
        apiId: params.apiId,
        instanceId: params.instanceId,
      });
      return response.items;
    } else {
      throw notFound();
    }
  },
});
