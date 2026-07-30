import PostWithComments from "@/components/PostWithComments";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

/** A comment permalink: the post with only that comment's thread beneath it. */
const CommunityPostCommentThread: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, communityId, commentId } = Route.useParams();
  return (
    <PostWithComments
      data={data}
      pluginId={pluginId}
      communityId={communityId}
      commentId={commentId}
    />
  );
};

export const Route = createFileRoute(
  "/s/$pluginId/c/$communityId/post/$apiId_/comment/$commentId"
)({
  params: pluginIdParams<{
    communityId: string;
    apiId: string;
    commentId: string;
  }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: CommunityPostCommentThread,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (plugin && (await plugin.hasDefined.onGetComments())) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        communityId: params.communityId,
        commentApiId: params.commentId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
