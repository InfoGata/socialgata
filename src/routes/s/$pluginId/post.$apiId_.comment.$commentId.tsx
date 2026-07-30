import PostWithComments from "@/components/PostWithComments";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

/** A comment permalink: the post with only that comment's thread beneath it. */
const PostCommentThread: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, commentId } = Route.useParams();
  return (
    <PostWithComments data={data} pluginId={pluginId} commentId={commentId} />
  );
};

export const Route = createFileRoute(
  "/s/$pluginId/post/$apiId_/comment/$commentId"
)({
  params: pluginIdParams<{ apiId: string; commentId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: PostCommentThread,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (plugin && (await plugin.hasDefined.onGetComments())) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        commentApiId: params.commentId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
