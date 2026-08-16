import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, MessageCircleIcon } from "lucide-react";
import parse from 'html-react-parser';
import DOMPurify from "dompurify";
import React from "react";
import ImageThumbnail from "./ImageThumbnail";
import ExpandedMedia from "./ExpandedMedia";
import ReactTimeago from "react-timeago";
import { FavoriteButton } from "./FavoriteButton";
import { createImageboardParseOptions } from "./ImageboardQuoteLink";
import { createPostBodyParseOptions } from "@/lib/post-body-links";
import {
  CommentPermalink,
  CommentPermalinkContext,
  FavoriteCommentSource,
} from "./CommentPermalink";

type Props = {
  comment: Post;
  platformType?: string;
  routePluginId?: string;
  /**
   * Where this comment lives, so it can link to its own thread. Absent when the
   * post isn't known (or the platform has no per-comment threads).
   */
  permalinkContext?: CommentPermalinkContext;
  /**
   * Saved with the comment when it's favorited, so the favorites page can link
   * back to the post. Unlike `permalinkContext` this is set for imageboards
   * too — their replies have no permalink, but the post they live in is still
   * a real place to link to.
   */
  favoriteSource?: FavoriteCommentSource;
  /** How deep in the reply tree this comment sits; 0 for a top-level one. */
  depth?: number;
};

const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });

/**
 * The colour of a comment's thread line, cycled by nesting depth. Indentation
 * alone is only a few pixels per level on a phone, which leaves a deep thread
 * as a stack of identical grey rules; a changing colour says which reply a
 * reply belongs to. Top level keeps the neutral rule, so the tint only appears
 * where there is actually nesting to follow.
 */
const threadLineColors = [
  "border-muted",
  "border-sky-500/60",
  "border-emerald-500/60",
  "border-amber-500/60",
  "border-violet-500/60",
  "border-rose-500/60",
];

const threadLineColor = (depth: number) =>
  threadLineColors[depth % threadLineColors.length];

/**
 * The small icon links under a comment. Sized as a proper touch target on
 * phones and tightened back up where there's a mouse.
 */
const commentActionClass =
  "inline-flex size-9 sm:size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors";

/** Total number of nested replies beneath a comment (all descendants). */
const countDescendants = (comment: Post): number =>
  comment.comments?.reduce(
    (total, child) => total + 1 + countDescendants(child),
    0,
  ) ?? 0;

/** Short label for a distinguished status (moderator/admin). */
const distinguishedLabel = (distinguished: string): string => {
  if (distinguished === "moderator") return "MOD";
  if (distinguished === "admin") return "ADMIN";
  return distinguished.toUpperCase();
};

// Named separately from the memoized export below so the recursive renders
// inside go through the memo rather than around it.
const Comment = (props: Props) => {
  const { comment, platformType = "forum", routePluginId, permalinkContext, favoriteSource, depth = 0 } = props;
  const [expand, setExpand] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };

  // Favorites saved before replies were stamped carry no `pluginId` on their
  // children, so fall back to the plugin the route already knows about.
  const favoritePluginId = comment.pluginId || routePluginId;

  // Both option sets handle embedded images; they differ in what they do with
  // anchors. Built as one memo so a forum comment never pays for the
  // imageboard options it won't use.
  const parseOptions = React.useMemo(
    () =>
      platformType === "imageboard"
        ? createImageboardParseOptions(
            comment.pluginId || "",
            comment.communityApiId,
            comment.instanceId,
          )
        : createPostBodyParseOptions(comment.pluginId || routePluginId || ""),
    [
      platformType,
      comment.pluginId,
      comment.communityApiId,
      comment.instanceId,
      routePluginId,
    ],
  );

  // Sanitizing and parsing the body are by far the most expensive things a
  // comment does, and a thread renders one component per comment. Without
  // these memos an unrelated re-render higher up redoes the work for every
  // comment on the page, which is seconds of blocked main thread on a large
  // thread.
  const clean = React.useMemo(
    () => DOMPurify.sanitize(comment.body || ""),
    [comment.body],
  );
  const parsedBody = React.useMemo(
    () => parse(clean, parseOptions),
    [clean, parseOptions],
  );

  // Imageboard-style rendering
  if (platformType === "imageboard") {
    return (
      <div className={`border-l-2 ${threadLineColor(depth)} pl-2 sm:pl-4 my-3 sm:my-4`} data-post-number={comment.number}>
        {/* Expanded Media - Full Width Above Content */}
        {expand && (comment.url || comment.videoSources?.length) && comment.thumbnailUrl && (
          <div className="mb-3">
            <ExpandedMedia
              url={comment.url ?? ""}
              isVideo={comment.isVideo}
              videoSources={comment.videoSources}
              thumbnailUrl={comment.thumbnailUrl}
              alt={comment.title || "Reply image"}
              className="rounded-md max-w-full border w-full"
              toggleExpand={toggleExpand}
            />
          </div>
        )}

        <div className="flex gap-3">
          {/* Thumbnail - Only shown when not expanded */}
          {!expand && comment.thumbnailUrl && (
            <div className="rounded-md w-24 h-24 bg-muted overflow-hidden shrink-0">
              <ImageThumbnail
                url={comment.url}
                thumbnailUrl={comment.thumbnailUrl}
                isVideo={comment.isVideo}
                toggleExpand={toggleExpand}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Author, Post Number & Time */}
            <div className="flex items-center gap-1.5 mb-2 text-xs flex-wrap">
              <span className="font-semibold text-muted-foreground">
                {comment.authorName || "Anonymous"}
              </span>

              {comment.number && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground font-mono">
                    No. {comment.number}
                  </span>
                </>
              )}

              {comment.publishedDate && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    <ReactTimeago date={comment.publishedDate} />
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            {comment.title && (
              <div className="text-sm font-bold text-foreground mb-2">
                {comment.title}
              </div>
            )}

            {/* Body */}
            {comment.body && (
              <div className="text-sm text-foreground">
                <div className="whitespace-pre-wrap wrap-break-word">
                  {parsedBody}
                </div>
              </div>
            )}

            {/* Favorite Button & Original Link */}
            {(favoritePluginId && comment.apiId || comment.originalUrl) && (
              <div className="mt-1 flex items-center gap-0.5 sm:gap-2 -ml-1.5 sm:ml-0">
                {favoritePluginId && comment.apiId && (
                  <FavoriteButton
                    type="comment"
                    item={comment}
                    pluginId={favoritePluginId}
                    size="sm"
                    className="h-9 w-9 sm:h-7 sm:w-7"
                    source={favoriteSource}
                  />
                )}
                {routePluginId && comment.apiId && (
                  <Link
                    to="/s/$pluginId/post/$apiId"
                    params={{
                      pluginId: routePluginId,
                      apiId: comment.apiId,
                    }}
                    className={commentActionClass}
                    aria-label="View comment thread"
                  >
                    <MessageCircleIcon className="h-4 w-4" />
                  </Link>
                )}
                {comment.originalUrl && (
                  <a
                    href={comment.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={commentActionClass}
                    aria-label="View original"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        <div className="ml-0 sm:ml-2">
          {comment.comments?.length
            ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} platformType={platformType} routePluginId={routePluginId} permalinkContext={permalinkContext} favoriteSource={favoriteSource} depth={depth + 1} />)
            : undefined}
        </div>
      </div>
    );
  }

  // Forum/default style rendering
  const descendants = countDescendants(comment);

  return (
    // Indentation is per nesting level, so it stays tight on a phone: any more
    // and a deep thread is a column one word wide. The line's colour carries
    // the depth that the indentation no longer can.
    <div className={`border-l-2 ${threadLineColor(depth)} pl-2 sm:pl-4 my-3 sm:my-4`}>
      {/* Meta line — click the toggle to collapse the whole subtree */}
      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex size-6 shrink-0 -ml-1 items-center justify-center rounded font-mono text-sm leading-none text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors sm:size-4 sm:ml-0 sm:text-xs"
          aria-label={collapsed ? "Expand comment" : "Collapse comment"}
          aria-expanded={!collapsed}
        >
          {collapsed ? "+" : "−"}
        </button>
        <Link
          to="/s/$pluginId/user/$apiId"
          params={{
            pluginId: comment.pluginId || "",
            apiId: comment.authorApiId || "",
          }}
          className={`font-medium hover:text-primary transition-colors ${comment.isSubmitter ? "text-primary" : ""}`}
        >
          {comment.authorName}
        </Link>
        {comment.isSubmitter && (
          <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary">
            OP
          </span>
        )}
        {comment.distinguished && (
          <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-green-500/15 text-green-600 dark:text-green-400">
            {distinguishedLabel(comment.distinguished)}
          </span>
        )}
        {comment.stickied && (
          <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
            Pinned
          </span>
        )}
        {/* Each separator is bundled with the value it precedes, so a wrap on a
            narrow screen never strands a bullet at the end of a line. */}
        {comment.score != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-muted-foreground/40">•</span>
            <span>
              {numberFormatter.format(comment.score)}{" "}
              {Math.abs(comment.score) === 1 ? "point" : "points"}
            </span>
          </span>
        )}
        {comment.publishedDate && (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-muted-foreground/40">•</span>
            <ReactTimeago date={comment.publishedDate} />
          </span>
        )}
        {comment.edited && (
          <span className="text-muted-foreground/50 italic">• edited</span>
        )}
        {collapsed && descendants > 0 && (
          <span className="text-muted-foreground/50">
            ({descendants} {descendants === 1 ? "reply" : "replies"})
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="md-body text-sm text-foreground wrap-break-word">
            {parsedBody}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2 -ml-1.5 sm:ml-0 mt-0.5">
            {favoritePluginId && comment.apiId && (
              <FavoriteButton
                type="comment"
                item={comment}
                pluginId={favoritePluginId}
                size="sm"
                className="h-9 w-9 sm:h-7 sm:w-7"
                source={favoriteSource}
              />
            )}

            {permalinkContext && comment.apiId ? (
              <CommentPermalink
                context={permalinkContext}
                commentApiId={comment.apiId}
                className={commentActionClass}
              />
            ) : (
              routePluginId &&
              comment.apiId && (
                <Link
                  to="/s/$pluginId/post/$apiId"
                  params={{
                    pluginId: routePluginId,
                    apiId: comment.apiId,
                  }}
                  className={commentActionClass}
                  aria-label="View comment thread"
                >
                  <MessageCircleIcon className="h-4 w-4" />
                </Link>
              )
            )}

            {comment.originalUrl && (
              <a
                href={comment.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={commentActionClass}
                aria-label="View original"
              >
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}
          </div>
          <div className="ml-0 sm:ml-2">
            {comment.comments?.length
              ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} platformType={platformType} routePluginId={routePluginId} permalinkContext={permalinkContext} favoriteSource={favoriteSource} depth={depth + 1} />)
              : undefined}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Memoized because a thread renders one of these per comment and the props are
 * stable: state changes in the post above (the feed link resolving, a refresh
 * finishing) would otherwise re-render every comment in the tree.
 */
const CommentComponent = React.memo(Comment);
CommentComponent.displayName = "CommentComponent";

export default CommentComponent;
