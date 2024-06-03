import CommentComponent from "@/components/CommentComponent";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";

const Comments: React.FC = () => {
  const data = Route.useLoaderData();
  return (
    <div>
      {data.map((d) => (
        <CommentComponent comment={d} />
      ))}
    </div>
  );
};

export const Route = createFileRoute(
  "/plugins/$pluginId/community/$communityId/comments/$apiId"
)({
  component: Comments,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getComments) {
      const response = await service.getComments(
        params.communityId,
        params.apiId
      );
      console.log(response);
      return [];
    } else {
      throw notFound();
    }
  },
});
