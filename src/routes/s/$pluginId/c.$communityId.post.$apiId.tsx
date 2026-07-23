import PostWithComments from "@/components/PostWithComments";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

const CommunityPostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  return <PostWithComments data={data} pluginId={pluginId} />;
};

export const Route = createFileRoute(
  "/s/$pluginId/c/$communityId/post/$apiId"
)({
  params: pluginIdParams<{ communityId: string; apiId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: CommunityPostComments,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetComments()) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        communityId: params.communityId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
});
