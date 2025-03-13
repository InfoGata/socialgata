import { usePagination } from "@/hooks/usePagination";
import PostComponent from "./PostComponent";
import { GetFeedResponse, PageInfo } from "@/plugintypes";
import { PaginationNext, PaginationPrevious, Pagination, PaginationContent, PaginationItem } from "./ui/pagination";
import { TabLink } from "./TabLink";

type FeedProps = {
  feedTypeId?: string;
  data: GetFeedResponse;
  pageInfo?: PageInfo;
  pluginId: string;
  instanceId?: string;
}

const Feed: React.FC<FeedProps> = (props) => {
  const { feedTypeId, data, pageInfo, pluginId, instanceId } = props;
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(pageInfo);

  return (
    <div>
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 mb-2 text-muted-foreground">
        {data.feedTypes?.map((feedType) => (
          <TabLink
            key={feedType.id}
            label={feedType.displayName}
            to={`/plugins/${pluginId}/feed?feedTypeId=${feedType.id}`}
            active={data.feedTypeId === feedType.id}
          />
        ))}
      </div>
      {data.items.map((item) => (
        <PostComponent key={item.apiId} post={item} instanceId={instanceId} />
      ))}
      <Pagination>
        <PaginationContent>
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationPrevious
                to="."
                search={{ page: prevPage?.page, feedTypeId: feedTypeId }}
              />
            </PaginationItem>
          )}
          {hasNextPage && (
            <PaginationItem>
              <PaginationNext
                to="."
                search={{ page: nextPage?.page, feedTypeId: feedTypeId }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default Feed;