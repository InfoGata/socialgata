import PostWithComponents from "@/components/PostWithComponents";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";

const CommunityPostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  return <PostWithComponents data={data} pluginId={pluginId} />;
};

export const Route = createFileRoute(
  "/plugins/$pluginId/instances/$instanceId/community/$communityId/post/$apiId"
)({
  component: CommunityPostComments,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getComments) {
      const response = await service.getComments({
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
