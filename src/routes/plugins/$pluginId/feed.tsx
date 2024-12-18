import PostComponent from '@/components/PostComponent';
import { TabLink } from '@/components/TabLink';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { PageInfo } from '@/plugintypes';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Feed: React.FC = () => {
  const data = Route.useLoaderData();
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(data.pageInfo);
  const params = Route.useParams();
  const feedTypeId = Route.useSearch().feedTypeId;
  
  return (
    <div>
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 mb-2 text-muted-foreground">
        {data.feedTypes?.map((feedType) => (
          <TabLink
            key={feedType.id}
            label={feedType.displayName}
            to={`/plugins/${params.pluginId}/feed?feedTypeId=${feedType.id}`}
            active={data.feedTypeId === feedType.id}
          />
        ))}
      </div>
      {data.items.map((item) => (
        <PostComponent key={item.title} post={item} />
      ))}
      <Pagination>
        <PaginationContent>
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationPrevious
                search={{ ...prevPage, feedTypeId: feedTypeId }}
              />
            </PaginationItem>
          )}
          {hasNextPage && (
            <PaginationItem>
              <PaginationNext
                search={{ ...nextPage, feedTypeId: feedTypeId }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export const Route = createFileRoute('/plugins/$pluginId/feed')({
  component: Feed,
  loaderDeps: ({search}) => ({pageInfo: search.pageInfo, feedTypeId: search.feedTypeId}),
  loader: async ({ params, deps: { pageInfo, feedTypeId } }) => {
    const service = getService(params.pluginId);
    if (service && service.getFeed) {
      const response = await service.getFeed({pageInfo: pageInfo, feedTypeId: feedTypeId});
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): {pageInfo: PageInfo, feedTypeId?: string} => {
    const pageInfo: PageInfo = search;
    const feedTypeId = search.feedTypeId as string | undefined;
    return {pageInfo, feedTypeId};
  }
});