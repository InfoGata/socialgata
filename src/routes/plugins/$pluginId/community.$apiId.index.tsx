import PostComponent from "@/components/PostComponent";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(data.pageInfo);
  const posts = data.items;
  return (
    <div>
      {posts.map((p) => (
        <PostComponent key={p.apiId} post={p} />
      ))}
      <Pagination>
        <PaginationContent>
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationPrevious
                to="/plugins/$pluginId/community/$apiId"
                params={{ pluginId: params.pluginId || "", apiId: params.apiId }}
                search={{ page: prevPage?.page }}
              />
            </PaginationItem>
          )}
          {hasNextPage && (
            <PaginationItem>
              <PaginationNext
                to="/plugins/$pluginId/community/$apiId"
                params={{ pluginId: params.pluginId || "", apiId: params.apiId }}
                search={{ page: nextPage?.page }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

type CommunitySearch = {
  page?: string | number;
}

export const Route = createFileRoute("/plugins/$pluginId/community/$apiId/")({
  component: Community,
  loaderDeps: ({search}) => ({page: search.page}),
  loader: async ({ params, deps: { page } }) => {
    const service = getService(params.pluginId);
    if (service && service.getCommunity) {
      const response = await service.getCommunity({
        apiId: params.apiId,
        pageInfo: { page: page },
      });
      return response;
    } else {
      throw notFound();
    }
  },
  validateSearch: (search: Record<string, unknown>): CommunitySearch => {
    const page = search.page as string | number | undefined;
    return {page};
  }
});
