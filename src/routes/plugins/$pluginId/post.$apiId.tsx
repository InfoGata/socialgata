import PostWithComponents from '@/components/PostWithComponents';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router';
import React from 'react';

const PostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  return <PostWithComponents data={data} pluginId={pluginId} />;
};

export const Route = createFileRoute('/plugins/$pluginId/post/$apiId')({
  component: PostComments,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getComments) {
      const response = await service.getComments({
        apiId: params.apiId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
})