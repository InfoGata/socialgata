import PostWithComponents from '@/components/PostWithComponents';
import { buttonVariants } from '@/components/ui/button';
import { getService } from '@/services/selector-service';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import React from 'react';
import { Helmet } from 'react-helmet-async';

const PostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const title = data.post?.title;
  return (
    <>
      <Link className={buttonVariants({ variant: "ghost" })} to="/plugins/$pluginId/feed" params={{ pluginId: params.pluginId }}>
        ← Back to Stories
      </Link>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PostWithComponents data={data} />;
    </>
  );
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