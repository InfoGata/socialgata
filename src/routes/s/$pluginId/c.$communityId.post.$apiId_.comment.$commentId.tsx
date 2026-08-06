import PostWithComments from "@/components/PostWithComments";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";
import {
  canonicalizePluginUrl,
  commentsLoaderDeps,
  pluginIdParams,
  pluginNotFoundComponent,
  validateCommentsSearch,
} from "@/lib/plugin-route";

/** A comment permalink: the post with only that comment's thread beneath it. */
const CommunityPostCommentThread: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, communityId, commentId } = Route.useParams();
  const { sortId, timeRangeId } = Route.useSearch();
  return (
    <PostWithComments
      data={data}
      pluginId={pluginId}
      communityId={communityId}
      commentId={commentId}
      sortId={sortId}
      timeRangeId={timeRangeId}
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
  validateSearch: validateCommentsSearch,
  loaderDeps: commentsLoaderDeps,
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: CommunityPostCommentThread,
  loader: async ({ params, deps, context }) => {
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (plugin && (await plugin.hasDefined.onGetComments())) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        communityId: params.communityId,
        commentApiId: params.commentId,
        sortId: deps.sortId,
        timeRangeId: deps.timeRangeId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
