import PostComponent from "./PostComponent";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "./ui/pagination";
import { usePagination } from "@/hooks/usePagination";
import { usePlugins } from "@/hooks/usePlugins";
import { PageInfo, Post, Community, SortOption } from "@/plugintypes";
import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { FavoriteButton } from "./FavoriteButton";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ExternalLinkIcon, Inbox, XIcon } from "lucide-react";
import BrowseCommunitiesButton from "./BrowseCommunitiesButton";
import SortControls from "./SortControls";
import { SearchBar } from "./SearchBar";
import { Button } from "./ui/button";

type CommunityFeedProps = {
  posts: Post[];
  pluginId: string;
  pageInfo?: PageInfo;
  instanceId?: string;
  /** The community's api id from the route, used when the plugin returns no community */
  apiId?: string;
  community?: Community;
  sortOptions?: SortOption[];
  sortId?: string;
  timeRangeId?: string;
  /** Active in-community search query, from the route's `q` search param */
  query?: string;
}

const CommunityFeed: React.FC<CommunityFeedProps> = (props) => {
  const { posts, pluginId, pageInfo, instanceId, apiId, community, sortOptions, sortId, timeRangeId, query } = props;
  const { nextPage, prevPage, hasNextPage, hasPreviousPage } = usePagination(pageInfo);
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);
  const platformType = plugin?.platformType || "forum";
  const navigate = useNavigate();

  /**
   * Plugins aren't required to describe the community they served posts for, so
   * fall back to what the route already tells us. The api id doubles as the
   * name because that is what community listings show for such plugins, which
   * keeps a favorite made here identical to one made from the listing.
   */
  const headerCommunity: Community | undefined = React.useMemo(() => {
    if (community) return community;
    if (!apiId) return undefined;
    return { apiId, name: apiId, ...(instanceId ? { instanceId } : {}) };
  }, [community, apiId, instanceId]);

  // Only plugins that implement onSearchCommunity can scope a search to one
  // community; without this the box would silently return the unfiltered feed.
  const [canSearch, setCanSearch] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    plugin?.hasDefined.onSearchCommunity().then((defined) => {
      if (!cancelled) setCanSearch(defined);
    });
    return () => {
      cancelled = true;
    };
  }, [plugin]);

  /**
   * Search state lives in the URL. `sortId`/`timeRangeId` are cleared because
   * search sorts and listing sorts are different vocabularies, and `page`
   * because cursors are specific to the query they were issued for.
   */
  const setQuery = (next?: string) => {
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: next || undefined,
        sortId: undefined,
        timeRangeId: undefined,
        page: undefined,
      }),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-2">
        {/* Browse Communities Button */}
        <BrowseCommunitiesButton pluginId={pluginId} instanceId={instanceId} />

        {/* Community Header */}
        {headerCommunity && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{headerCommunity.name}</CardTitle>
                  {headerCommunity.description && (
                    <CardDescription className="mt-2">{headerCommunity.description}</CardDescription>
                  )}
                  {headerCommunity.originalUrl && (
                    <a
                      href={headerCommunity.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                      <span>View original</span>
                    </a>
                  )}
                </div>
                <FavoriteButton
                  type="community"
                  item={headerCommunity}
                  pluginId={pluginId}
                  size="lg"
                  variant="icon"
                />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* In-Community Search */}
        {canSearch && (
          <div className="flex items-center gap-2 mb-4">
            <SearchBar
              key={query ?? ""}
              initialQuery={query}
              onSearch={setQuery}
              placeholder={
                headerCommunity?.name
                  ? `Search ${headerCommunity.name}...`
                  : "Search this community..."
              }
              className="flex-1 max-w-md"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuery(undefined)}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Sort Controls */}
        <SortControls
          sortOptions={sortOptions}
          sortId={sortId}
          timeRangeId={timeRangeId}
        />

        {/* Posts Section */}
        <div className="space-y-2">
          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <h3 className="text-sm font-medium mb-1">
                {query ? `No results for "${query}"` : "No posts yet"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {query
                  ? "Try a different search, or clear it to browse the community."
                  : "Check back later for new content."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
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
          )}

          {/* Pagination */}
          {(hasNextPage || hasPreviousPage) && (
            <div className="mt-4 py-2 border-t">
              <Pagination>
                <PaginationContent className="flex justify-center gap-1">
                  {hasPreviousPage && (
                    <PaginationItem>
                      <PaginationPrevious
                        to="."
                        search={(prev) => ({ ...prev, page: prevPage?.page })}
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
                        search={(prev) => ({ ...prev, page: nextPage?.page })}
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
