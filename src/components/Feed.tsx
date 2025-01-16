import { usePagination } from "@/hooks/usePagination";
import PostComponent from "./PostComponent";
import { GetFeedResponse, PageInfo } from "@/plugintypes";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "./ui/pagination";
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
        <PostComponent key={item.title} post={item} instanceId={instanceId} />
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
}

export default Feed;