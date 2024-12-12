import PostComponent from '@/components/PostComponent';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { PageInfo } from '@/plugintypes';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Feed: React.FC = () => {
  const data = Route.useLoaderData();
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(data.pageInfo);
  
  return (
    <div>
      {data.items.map((item) => (
        <PostComponent key={item.title} post={item} />
      ))}
      <Pagination>
        <PaginationContent>
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationPrevious search={{...prevPage}} />
            </PaginationItem>
          )}
          {hasNextPage && (
            <PaginationItem>
              <PaginationNext search={{...nextPage}} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export const Route = createFileRoute('/plugins/$pluginId/feed')({
  component: Feed,
  loaderDeps: ({search}) => ({pageInfo: search}),
  loader: async ({ params, deps: { pageInfo } }) => {
    const service = getService(params.pluginId);
    if (service && service.getFeed) {
      const response = await service.getFeed({pageInfo});
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): PageInfo => {
    const pageInfo: PageInfo = search;

    return pageInfo;
  }
});