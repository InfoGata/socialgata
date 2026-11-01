import Feed from "@/components/Feed";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { GlobeIcon } from "lucide-react";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";
import { usePlugins } from "@/hooks/usePlugins";

/**
 * Every post a plugin knows of that links to one site: Hacker News'
 * `from?site=`, Lobsters' `/domains/` and old Reddit's `/domain/`.
 */
const DomainFeed: React.FC = () => {
  const data = Route.useLoaderData();
  const { pluginId, domain } = Route.useParams();
  const search = Route.useSearch();
  const { plugins } = usePlugins();
  const pluginName = plugins.find((p) => p.id === pluginId)?.name;

  return (
    <Feed
      sortId={search.sortId}
      timeRangeId={search.timeRangeId}
      data={data}
      pageInfo={data.pageInfo}
      pluginId={pluginId}
      title={domain}
      header={
        <div className="flex items-center gap-2 mb-3 min-w-0">
          <GlobeIcon className="h-5 w-5 text-muted-foreground shrink-0" />
          <h1 className="text-xl font-bold truncate">{domain}</h1>
          {pluginName && (
            <span className="text-sm text-muted-foreground shrink-0">
              on {pluginName}
            </span>
          )}
        </div>
      }
    />
  );
};

type DomainSearch = {
  page?: string | number;
  sortId?: string;
  timeRangeId?: string;
};

export const Route = createFileRoute("/s/$pluginId/domain/$domain")({
  params: pluginIdParams<{ domain: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: DomainFeed,
  loaderDeps: ({ search }) => ({
    page: search.page,
    sortId: search.sortId,
    timeRangeId: search.timeRangeId,
  }),
  loader: async ({ params, deps: { page, sortId, timeRangeId }, context }) => {
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (plugin && (await plugin.hasDefined.onGetDomain())) {
      return plugin.remote.onGetDomain({
        domain: params.domain,
        pageInfo: { page },
        sortId,
        timeRangeId,
      });
    }
    throw notFound();
  },
  validateSearch: (search: Record<string, unknown>): DomainSearch => {
    const page = search.page as string | number | undefined;
    const sortId = search.sortId as string | undefined;
    const timeRangeId = search.timeRangeId as string | undefined;
    return { page, sortId, timeRangeId };
  },
});
