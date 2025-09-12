import { usePagination } from "@/hooks/usePagination";
import PostComponent from "./PostComponent";
import { GetFeedResponse, PageInfo } from "@/plugintypes";
import { PaginationNext, PaginationPrevious, Pagination, PaginationContent, PaginationItem } from "./ui/pagination";
import { Loader2, TrendingUp, Clock, Award, Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import React from "react";

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
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        There are no posts to display. Try refreshing the page or check back later.
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading posts...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          {/* Feed Type Tabs */}
          {data.feedTypes && data.feedTypes.length > 0 && (
            <div className="bg-card border rounded-lg p-2 mb-4">
              <div className="flex flex-wrap gap-2">
                {data.feedTypes.map((feedType) => (
                  <Link
                    key={feedType.id}
                    to="/plugins/$pluginId/feed"
                    params={{ pluginId }}
                    search={{ feedTypeId: feedType.id }}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-md transition-all
                      ${data.feedTypeId === feedType.id 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    {getFeedIcon(feedType.id)}
                    <span className="font-medium">{feedType.displayName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Feed Indicator */}
          {data.feedTypeId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="px-2">
                Viewing {data.feedTypes?.find(f => f.id === data.feedTypeId)?.displayName || 'Feed'}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
        </div>

        {/* Posts Section */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingState />
          ) : data.items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Posts Grid */}
              <div className="grid gap-4">
                {data.items.map((item, index) => (
                  <div 
                    key={item.apiId} 
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PostComponent post={item} instanceId={instanceId} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {(hasNextPage || hasPreviousPage) && (
                <div className="mt-8 py-4 border-t">
                  <Pagination>
                    <PaginationContent className="flex justify-center gap-2">
                      {hasPreviousPage && (
                        <PaginationItem>
                          <PaginationPrevious
                            to="."
                            search={{ page: prevPage?.page, feedTypeId: feedTypeId }}
                            className="hover:bg-muted transition-colors"
                          />
                        </PaginationItem>
                      )}
                      
                      {/* Page Indicator */}
                      {pageInfo?.page && (
                        <PaginationItem className="flex items-center px-4">
                          <span className="text-sm text-muted-foreground">
                            Page {pageInfo.page}
                          </span>
                        </PaginationItem>
                      )}
                      
                      {hasNextPage && (
                        <PaginationItem>
                          <PaginationNext
                            to="."
                            search={{ page: nextPage?.page, feedTypeId: feedTypeId }}
                            className="hover:bg-muted transition-colors"
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