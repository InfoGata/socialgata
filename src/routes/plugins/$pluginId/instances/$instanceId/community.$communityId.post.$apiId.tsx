import PostWithComments from "@/components/PostWithComments";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";

const CommunityPostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  return <PostWithComments data={data} pluginId={pluginId} />;
};

export const Route = createFileRoute(
  "/plugins/$pluginId/instances/$instanceId/community/$communityId/post/$apiId"
)({
  component: CommunityPostComments,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetComments()) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        communityId: params.communityId,
        instanceId: params.instanceId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
