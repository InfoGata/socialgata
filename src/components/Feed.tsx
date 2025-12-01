import { usePagination } from "@/hooks/usePagination";
import PostComponent from "./PostComponent";
import { GetFeedResponse, PageInfo } from "@/plugintypes";
import { PaginationNext, PaginationPrevious, Pagination, PaginationContent, PaginationItem } from "./ui/pagination";
import { Loader2, TrendingUp, Clock, Award, Inbox } from "lucide-react";
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

  const getFeedIcon = (feedTypeId?: string) => {
    switch(feedTypeId?.toLowerCase()) {
      case 'top':
      case 'best':
        return <TrendingUp className="w-4 h-4" />;
      case 'new':
        return <Clock className="w-4 h-4" />;
      case 'hot':
        return <Award className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Inbox className="w-12 h-12 text-muted-foreground mb-3" />
      <h3 className="text-base font-semibold mb-1">No posts yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        There are no posts to display. Try refreshing the page or check back later.
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-primary mb-3" />
      <p className="text-sm text-muted-foreground">Loading posts...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4">
        {/* Header Section */}
        <div className="mb-6">
          {/* Communities Link */}
          <div className="mb-4">
            <BrowseCommunitiesButton pluginId={pluginId} instanceId={instanceId} />
          </div>

          {/* Feed Type Tabs */}
          {data.feedTypes && data.feedTypes.length > 0 && (
            <div className="bg-card/50 backdrop-blur-sm border-2 border-border/50 rounded-2xl p-2 mb-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {data.feedTypes.map((feedType) => (
                  <Link
                    key={feedType.id}
                    to="/plugins/$pluginId/feed"
                    params={{ pluginId }}
                    search={{ feedTypeId: feedType.id }}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold
                      ${data.feedTypeId === feedType.id
                        ? 'bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary/20'
                        : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground hover:scale-102'
                      }
                    `}
                  >
                    {getFeedIcon(feedType.id)}
                    <span>{feedType.displayName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Feed Indicator */}
          {data.feedTypeId && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                {getFeedIcon(data.feedTypeId)}
                <span className="font-medium">
                  {data.feedTypes?.find(f => f.id === data.feedTypeId)?.displayName || 'Feed'}
                </span>
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
          )}
        </div>

        {/* Posts Section */}
        <div className="space-y-3">
          {isLoading ? (
            <LoadingState />
          ) : data.items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Posts Grid */}
              <div className="grid gap-3">
                {data.items.map((item, index) => (
                  <div
                    key={item.apiId}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 40}ms`, animationDuration: '400ms' }}
                  >
                    <PostComponent post={item} instanceId={instanceId} platformType={platformType} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {(hasNextPage || hasPreviousPage) && (
                <div className="mt-6 pt-4 border-t-2 border-border/50">
                  <Pagination>
                    <PaginationContent className="flex justify-center gap-2">
                      {hasPreviousPage && (
                        <PaginationItem>
                          <PaginationPrevious
                            to="."
                            search={{ page: prevPage?.page, feedTypeId: feedTypeId }}
                            className="hover:bg-muted transition-all text-sm py-2 px-4 rounded-lg border border-border/40 hover:border-primary/30 font-medium"
                          />
                        </PaginationItem>
                      )}

                      {/* Page Indicator */}
                      {pageInfo?.page && (
                        <PaginationItem className="flex items-center px-4">
                          <span className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border/40">
                            Page {pageInfo.page}
                          </span>
                        </PaginationItem>
                      )}

                      {hasNextPage && (
                        <PaginationItem>
                          <PaginationNext
                            to="."
                            search={{ page: nextPage?.page, feedTypeId: feedTypeId }}
                            className="hover:bg-muted transition-all text-sm py-2 px-4 rounded-lg border border-border/40 hover:border-primary/30 font-medium"
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
    </div>
  );
}

export default Feed;