import { GetCommentsResponse, Post } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";
import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { usePlugins } from "@/hooks/usePlugins";
import { ArrowLeftIcon, ExternalLinkIcon, MessageCircleIcon, Users2Icon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImageboardPostsProvider } from "@/contexts/ImageboardPostsContext";
import {
  CommentPermalinkContext,
  FullThreadLink,
} from "./CommentPermalink";

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
}

const PostWithComments: React.FC<Props> = (props) => {
  const { data, pluginId, communityId, instanceId, commentId } = props;
  const [replies, setReplies] = React.useState<Post[] | null>(null);
  const [hasFeed, setHasFeed] = React.useState(false);
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


  // Imageboard replies are numbered posts in one thread rather than a tree of
  // individually addressable comments, so they get no permalinks.
  const postApiId = data.post?.apiId;
  const permalinkContext: CommentPermalinkContext | undefined =
    pluginId && postApiId && platformType !== "imageboard"
      ? { pluginId, postApiId, communityId, instanceId }
      : undefined;

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
      {comments.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Comments
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {comments.map((d) => (
              <CommentComponent key={d.apiId} comment={d} platformType={platformType} routePluginId={pluginId} permalinkContext={permalinkContext} />
            ))}
          </CardContent>
        </Card>
      )}

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
              <CommentComponent key={r.apiId} comment={r} platformType={platformType} routePluginId={pluginId} permalinkContext={permalinkContext} />
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
