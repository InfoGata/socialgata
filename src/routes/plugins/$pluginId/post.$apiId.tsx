import PostWithComments from '@/components/PostWithComments';
import { createFileRoute, notFound } from '@tanstack/react-router';
import React from 'react';

const PostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  return <PostWithComments data={data} pluginId={pluginId} />;
};

export const Route = createFileRoute('/plugins/$pluginId/post/$apiId')({
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