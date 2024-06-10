import CommentComponent from "@/components/CommentComponent";
import PostComponent from "@/components/PostComponent";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";

const Comments: React.FC = () => {
  const data = Route.useLoaderData();
  return (
    <div>
      {data.community && <span>Community: {data.community?.name}</span>}
      {data.post && <PostComponent post={data.post} />}
      <div>
        {data.items.map((d) => (
          <CommentComponent comment={d} />
        ))}
      </div>
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
      return response;
    } else {
      throw notFound();
    }
  },
});
