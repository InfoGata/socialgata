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

const CommunityPostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, instanceId, communityId } = Route.useParams();
  const { sortId, timeRangeId } = Route.useSearch();
  return (
    <PostWithComments
      data={data}
      pluginId={pluginId}
      instanceId={instanceId}
      communityId={communityId}
      sortId={sortId}
      timeRangeId={timeRangeId}
    />
  );
};

export const Route = createFileRoute(
  "/s/$pluginId/i/$instanceId/c/$communityId/post/$apiId"
)({
  params: pluginIdParams<{ instanceId: string; communityId: string; apiId: string }>(),
  validateSearch: validateCommentsSearch,
  loaderDeps: commentsLoaderDeps,
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: CommunityPostComments,
  loader: async ({ params, deps, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetComments()) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        communityId: params.communityId,
        instanceId: params.instanceId,
        sortId: deps.sortId,
        timeRangeId: deps.timeRangeId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
