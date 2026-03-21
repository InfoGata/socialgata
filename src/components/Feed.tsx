import { usePagination } from "@/hooks/usePagination";
import PostComponent from "./PostComponent";
import { GetFeedResponse, PageInfo } from "@/plugintypes";
import { PaginationNext, PaginationPrevious, Pagination, PaginationContent, PaginationItem } from "./ui/pagination";
import { Loader2, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import React from "react";
import { usePlugins } from "@/hooks/usePlugins";
import BrowseCommunitiesButton from "./BrowseCommunitiesButton";

type FeedProps = {
  feedTypeId?: string;
  data: GetFeedResponse;
  pageInfo?: PageInfo;
  pluginId: string;
  instanceId?: string;
  isLoading?: boolean;
}

const Feed: React.FC<FeedProps> = (props) => {
  const { feedTypeId, data, pageInfo, pluginId, instanceId, isLoading } = props;
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(pageInfo);
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);
  const platformType = plugin?.platformType || "forum";

  return (
    <div className="min-h-screen bg-background">
      {plugin?.name && <title>{`${plugin.name} - SocialGata`}</title>}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <BrowseCommunitiesButton pluginId={pluginId} instanceId={instanceId} />

          {/* Feed Type Tabs */}
          {data.feedTypes && data.feedTypes.length > 0 && (
            <div className="flex items-center gap-1 border-b border-border/60 mb-4">
              {data.feedTypes.map((feedType, index) => {
                const isActive = data.feedTypeId
                  ? data.feedTypeId === feedType.id
                  : index === 0;
                return (
                  <Link
                    key={feedType.id}
                    to={instanceId
                      ? "/plugins/$pluginId/instances/$instanceId/feed"
                      : "/plugins/$pluginId/feed"
                    }
                    params={instanceId
                      ? { pluginId, instanceId }
                      : { pluginId }
                    }
                    search={{ feedTypeId: feedType.id }}
                    className={`
                      px-3 py-2 text-sm font-medium transition-colors relative
                      ${isActive
                        ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    {feedType.displayName}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <h3 className="text-sm font-medium mb-1">No posts yet</h3>
            <p className="text-xs text-muted-foreground">Check back later for new content.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {data.items.map((item) => (
                <PostComponent key={item.apiId} post={item} instanceId={instanceId} platformType={platformType} />
              ))}
            </div>

            {/* Pagination */}
            {(hasNextPage || hasPreviousPage) && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <Pagination>
                  <PaginationContent className="flex justify-center gap-3">
                    {hasPreviousPage && (
                      <PaginationItem>
                        <PaginationPrevious
                          to="."
                          search={{ page: prevPage?.page, feedTypeId: feedTypeId }}
                          className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
                        />
                      </PaginationItem>
                    )}
                    {pageInfo?.page && (
                      <PaginationItem className="flex items-center">
                        <span className="text-xs text-muted-foreground font-medium px-2">
                          Page {pageInfo.page}
                        </span>
                      </PaginationItem>
                    )}
                    {hasNextPage && (
                      <PaginationItem>
                        <PaginationNext
                          to="."
                          search={{ page: nextPage?.page, feedTypeId: feedTypeId }}
                          className="text-sm px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Feed;
