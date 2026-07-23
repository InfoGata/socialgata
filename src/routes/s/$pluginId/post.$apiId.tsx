import PostWithComments from '@/components/PostWithComments';
import { createFileRoute, notFound } from '@tanstack/react-router';
import React from 'react';
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

const PostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  return <PostWithComments data={data} pluginId={pluginId} />;
};

export const Route = createFileRoute('/s/$pluginId/post/$apiId')({
  params: pluginIdParams<{ apiId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: PostComments,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetComments()) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
})