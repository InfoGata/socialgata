import PostWithComments from '@/components/PostWithComments';
import { createFileRoute, notFound } from '@tanstack/react-router';
import React from 'react';
import {
  canonicalizePluginUrl,
  commentsLoaderDeps,
  pluginIdParams,
  pluginNotFoundComponent,
  validateCommentsSearch,
} from "@/lib/plugin-route";

const PostComments: React.FC = () => {
  const data = Route.useLoaderData();
  const pluginId = Route.useParams().pluginId;
  const { sortId, timeRangeId } = Route.useSearch();
  return (
    <PostWithComments
      data={data}
      pluginId={pluginId}
      sortId={sortId}
      timeRangeId={timeRangeId}
    />
  );
};

export const Route = createFileRoute('/s/$pluginId/post/$apiId')({
  params: pluginIdParams<{ apiId: string }>(),
  validateSearch: validateCommentsSearch,
  loaderDeps: commentsLoaderDeps,
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: PostComments,
  loader: async ({ params, deps, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetComments()) {
      const response = await plugin.remote.onGetComments({
        apiId: params.apiId,
        sortId: deps.sortId,
        timeRangeId: deps.timeRangeId,
      });
      return response;
    } else {
      throw notFound();
    }
  },
})