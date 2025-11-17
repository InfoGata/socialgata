import PostComponent from "./PostComponent";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "./ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import { getService } from "@/services/selector-service";
import { PageInfo, Post } from "@/plugintypes";
import React from "react";

type CommunityFeedProps = {
  posts: Post[];
  pluginId: string;
  pageInfo?: PageInfo;
  instanceId?: string;
}

const CommunityFeed: React.FC<CommunityFeedProps> = (props) => {
  const { posts, pluginId, pageInfo, instanceId } = props;
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(pageInfo);
  const service = getService(pluginId);
  const platformType = service?.platformType || "forum";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2">
        {/* Posts Section */}
        <div className="space-y-2">
          {/* Posts Grid */}
          <div className="grid gap-2">
            {posts.map((p, index) => (
              <div
                key={p.apiId}
                className="animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <PostComponent post={p} instanceId={instanceId} platformType={platformType} />
              </div>
            ))}
          </div>

          {/* Pagination */}
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

                  {/* Page Indicator */}
                  {pageInfo?.page && (
                    <PaginationItem className="flex items-center px-2">
                      <span className="text-xs text-muted-foreground">
                        Page {pageInfo.page}
                      </span>
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
      </div>
    </div>
  );
}

export default CommunityFeed;
