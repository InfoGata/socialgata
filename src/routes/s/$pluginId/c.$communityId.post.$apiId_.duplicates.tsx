import PostDuplicates from "@/components/PostDuplicates";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";
import {
  DuplicatesSearch,
  validateDuplicatesSearch,
} from "@/lib/duplicates-search";

const CommunityPostDuplicatesPage: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId } = Route.useParams();
  const { sortId } = Route.useSearch();
  return <PostDuplicates data={data} pluginId={pluginId} sortId={sortId} />;
};

export const Route = createFileRoute(
  "/s/$pluginId/c/$communityId/post/$apiId_/duplicates"
)({
  params: pluginIdParams<{ communityId: string; apiId: string }>(),
  validateSearch: validateDuplicatesSearch,
  loaderDeps: ({ search }: { search: DuplicatesSearch }) => search,
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: CommunityPostDuplicatesPage,
  loader: async ({ params, deps: { page, sortId }, context }) => {
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (plugin && (await plugin.hasDefined.onGetPostDuplicates())) {
      return plugin.remote.onGetPostDuplicates({
        apiId: params.apiId,
        communityId: params.communityId,
        pageInfo: { page },
        sortId,
      });
    }
    throw notFound();
  },
});
