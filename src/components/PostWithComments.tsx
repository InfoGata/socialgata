import { GetCommentsResponse, Post } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";
import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { usePlugins } from "@/hooks/usePlugins";
import { ArrowLeftIcon, ExternalLinkIcon, MessageCircleIcon, RefreshCwIcon, Users2Icon } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";
import { ImageboardPostsProvider } from "@/contexts/ImageboardPostsContext";
import {
  CommentPermalinkContext,
  FavoriteCommentSource,
  FullThreadLink,
} from "./CommentPermalink";
import SortControls from "./SortControls";

/** Depth-first search for a comment anywhere in a comment tree. */
const findComment = (comments: Post[], apiId: string): Post | undefined => {
  for (const comment of comments) {
    if (comment.apiId === apiId) return comment;
    const found = comment.comments
      ? findComment(comment.comments, apiId)
      : undefined;
    if (found) return found;
  }
  return undefined;
};

interface Props {
  data: GetCommentsResponse;
  pluginId?: string;
  /** Community segment of the url, when the route has one. */
  communityId?: string;
  instanceId?: string;
  /**
   * Set when the route asked for a single comment thread (a comment
   * permalink) instead of every comment on the post.
   */
  commentId?: string;
  /** Sort selection from the route's search params, when the route has one. */
  sortId?: string;
  timeRangeId?: string;
}

const PostWithComments: React.FC<Props> = (props) => {
  const { data, pluginId, communityId, instanceId, commentId, sortId, timeRangeId } = props;
  const [replies, setReplies] = React.useState<Post[] | null>(null);
  const [hasFeed, setHasFeed] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const router = useRouter();
  const { plugins } = usePlugins();
  const plugin = pluginId ? plugins.find(p => p.id === pluginId) : null;
  const platformType = plugin?.platformType || "forum";

  React.useEffect(() => {
    if (plugin) {
      plugin.hasDefined.onGetFeed().then(setHasFeed);
    }
  }, [plugin]);

  const getReplies = async () => {
    if (!pluginId || !data.post?.moreRepliesId || !plugin) return;

    if (!await plugin.hasDefined.onGetCommentReplies()) return;
    const repliesResponse = await plugin.remote.onGetCommentReplies({
      apiId: data.post.moreRepliesId,
      instanceId: data.post.instanceId,
      communityApiId: data.post.communityApiId,
      postApiId: data.post.apiId,
    });
    setReplies(repliesResponse.items);
  }

  // The comments live in the route loader, so re-running it is the refresh.
  const refreshComments = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Replies were fetched separately and would otherwise linger next to the
      // freshly loaded comments.
      setReplies(null);
      await router.invalidate({ sync: true });
    } finally {
      setIsRefreshing(false);
    }
  };


  // Changing the sort re-runs the loader, but the separately-fetched "more
  // replies" belong to the previous ordering and would linger below the list.
  const sortKey = `${sortId ?? ""}|${timeRangeId ?? ""}`;
  const [repliesSortKey, setRepliesSortKey] = React.useState(sortKey);
  if (sortKey !== repliesSortKey) {
    setRepliesSortKey(sortKey);
    setReplies(null);
  }

  // Where these comments live. Saved with a comment when it's favorited, since
  // nothing on the comment itself names the post it came from.
  const postApiId = data.post?.apiId;
  const favoriteSource: FavoriteCommentSource | undefined =
    pluginId && postApiId
      ? {
          pluginId,
          postApiId,
          communityId,
          instanceId,
          postTitle: data.post?.title,
          platformType,
        }
      : undefined;

  // Imageboard replies are numbered posts in one thread rather than a tree of
  // individually addressable comments, so they get no permalinks. The post they
  // live in is still linkable, which is why favoriteSource isn't gated here.
  const permalinkContext: CommentPermalinkContext | undefined =
    platformType === "imageboard" ? undefined : favoriteSource;

  // A plugin that understands `commentApiId` already returns just the one
  // thread; narrow it here for the ones that hand back the whole post.
  const comments = React.useMemo(() => {
    if (!commentId) return data.items;
    const comment = findComment(data.items, commentId);
    return comment ? [comment] : data.items;
  }, [data.items, commentId]);

  const allPosts = React.useMemo(() => {
    const posts: Post[] = [];
    if (data.post) posts.push(data.post);
    posts.push(...data.items);
    if (replies) posts.push(...replies);
    return posts;
  }, [data.post, data.items, replies]);

  const content = (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <title>{data.post?.title}</title>

      {/* Feed Link */}
      {pluginId && hasFeed && (
        <Link
          to="/s/$pluginId/feed"
          params={{ pluginId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>{plugin?.name || "Feed"}</span>
        </Link>
      )}

      {/* Community Header */}
      {data.community && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users2Icon className="h-4 w-4" />
              <span>Community: <Link
                to={data.community.instanceId
                  ? "/s/$pluginId/i/$instanceId/c/$apiId"
                  : "/s/$pluginId/c/$apiId"}
                className="font-medium text-foreground hover:text-primary transition-colors"
                params={{
                  pluginId: pluginId || "",
                  instanceId: data.community.instanceId || "",
                  apiId: data.community.apiId,
                }}
              >{data.community.name}</Link></span>
              {data.community.originalUrl && (
                <a
                  href={data.community.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Post */}
      {data.post && (
        <Card>
          <CardContent className="p-0">
            <PostComponent post={data.post} platformType={platformType} showFullPost={true} />
          </CardContent>
          {data.post.originalUrl && (
            <CardContent className="pt-0 pb-3 px-4">
              <a
                href={data.post.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                <span>View original</span>
              </a>
            </CardContent>
          )}
        </Card>
      )}

      {/* Single Comment Thread Notice */}
      {commentId && permalinkContext && (
        <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <span>You are viewing a single comment thread. </span>
          <FullThreadLink
            context={permalinkContext}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            View all comments
          </FullThreadLink>
        </div>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Comments
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <SortControls
                sortOptions={data.sortOptions}
                sortId={sortId ?? data.sortId}
                timeRangeId={timeRangeId ?? data.timeRangeId}
                className="mb-0"
              />
              <Button
                onClick={refreshComments}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                aria-label="Refresh comments"
                aria-busy={isRefreshing}
              >
                <RefreshCwIcon className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {comments.length > 0 ? (
            comments.map((d) => (
              <CommentComponent key={d.apiId} comment={d} platformType={platformType} routePluginId={pluginId} permalinkContext={permalinkContext} favoriteSource={favoriteSource} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Load More Replies */}
      {data.post?.moreRepliesId && !replies && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={getReplies}
            variant="outline"
            className="min-w-[200px]"
          >
            Load more replies
          </Button>
        </div>
      )}

      {/* Additional Replies */}
      {replies && replies.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <h3 className="text-lg font-semibold">
              Additional Replies ({replies.length})
            </h3>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {replies.map((r) => (
              <CommentComponent key={r.apiId} comment={r} platformType={platformType} routePluginId={pluginId} permalinkContext={permalinkContext} favoriteSource={favoriteSource} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (platformType === "imageboard") {
    return (
      <ImageboardPostsProvider posts={allPosts}>
        {content}
      </ImageboardPostsProvider>
    );
  }

  return content;
};

export default PostWithComments;
