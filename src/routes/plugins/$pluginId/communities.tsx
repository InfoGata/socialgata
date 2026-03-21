import CommunityCard from '@/components/CommunityCard';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Communities: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(data.pageInfo);

  if (!data.items || data.items.length === 0) {
    return <div className="text-center text-muted-foreground p-8">
      No communities found.
    </div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Communities</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.items.map((community) => (
          <CommunityCard key={community.apiId} community={community} pluginId={params.pluginId} />
        ))}
      </div>

      {(hasNextPage || hasPreviousPage) && (
        <div className="mt-4 py-2 border-t">
          <Pagination>
            <PaginationContent className="flex justify-center gap-1">
              {hasPreviousPage && (
                <PaginationItem>
                  <PaginationPrevious
                    to="."
                    search={{ page: prevPage?.page }}
                    className="hover:bg-muted transition-colors text-sm py-1"
                  />
                </PaginationItem>
              )}
              {hasNextPage && (
                <PaginationItem>
                  <PaginationNext
                    to="."
                    search={{ page: nextPage?.page }}
                    className="hover:bg-muted transition-colors text-sm py-1"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

type CommunitiesSearch = {
  page?: string | number;
}

export const Route = createFileRoute('/plugins/$pluginId/communities')({
  component: Communities,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, deps: { page }, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetCommunities()) {
      const response = await plugin.remote.onGetCommunities({
        pageInfo: { page },
      });
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): CommunitiesSearch => {
    const page = search.page as string | number | undefined;
    return { page };
  }
})
