import CommunityFeed from "@/components/CommunityFeed";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

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

export const Route = createFileRoute("/s/$pluginId/i/$instanceId/c/$apiId/")({
  params: pluginIdParams<{ instanceId: string; apiId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
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
