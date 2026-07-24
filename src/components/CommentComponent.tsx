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

type Props = {
  comment: Post;
  platformType?: string;
  routePluginId?: string;
};

const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });

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

const CommentComponent: React.FC<Props> = (props) => {
  const { comment, platformType = "forum", routePluginId } = props;
  const [expand, setExpand] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const sanitizer = DOMPurify.sanitize;

  const clean = sanitizer(comment.body || "");
  const imageboardParseOptions = React.useMemo(
    () => createImageboardParseOptions(comment.pluginId || "", comment.communityApiId, comment.instanceId),
    [comment.pluginId, comment.communityApiId, comment.instanceId],
  );

  // Imageboard-style rendering
  if (platformType === "imageboard") {
    return (
      <div className="border-l-2 border-muted pl-4 my-4" data-post-number={comment.number}>
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
            <div className="rounded-md w-24 h-24 bg-muted overflow-hidden flex-shrink-0">
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
                <div className="whitespace-pre-wrap break-words">
                  {parse(clean, imageboardParseOptions)}
                </div>
              </div>
            )}

            {/* Favorite Button & Original Link */}
            {(comment.pluginId && comment.apiId || comment.originalUrl) && (
              <div className="mt-2 flex items-center gap-2">
                {comment.pluginId && comment.apiId && (
                  <FavoriteButton
                    type="comment"
                    item={comment}
                    pluginId={comment.pluginId}
                    size="sm"
                    className="h-7 w-7"
                  />
                )}
                {routePluginId && comment.apiId && (
                  <Link
                    to="/s/$pluginId/post/$apiId"
                    params={{
                      pluginId: routePluginId,
                      apiId: comment.apiId,
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircleIcon className="h-3.5 w-3.5" />
                  </Link>
                )}
                {comment.originalUrl && (
                  <a
                    href={comment.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        <div className="ml-2">
          {comment.comments?.length
            ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} platformType={platformType} routePluginId={routePluginId} />)
            : undefined}
        </div>
      </div>
    );
  }

  // Forum/default style rendering
  const descendants = countDescendants(comment);

  return (
    <div className="border-l-2 border-muted pl-4 my-4">
      {/* Meta line — click the toggle to collapse the whole subtree */}
      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex size-4 items-center justify-center rounded font-mono text-xs leading-none text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors"
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
        {comment.score != null && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <span>
              {numberFormatter.format(comment.score)}{" "}
              {Math.abs(comment.score) === 1 ? "point" : "points"}
            </span>
          </>
        )}
        {comment.publishedDate && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <ReactTimeago date={comment.publishedDate} />
          </>
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
          <div className="md-body text-sm text-foreground break-words">
            {parse(clean)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {comment.pluginId && comment.apiId && (
              <FavoriteButton
                type="comment"
                item={comment}
                pluginId={comment.pluginId}
                size="sm"
                className="h-7 w-7"
              />
            )}

            {routePluginId && comment.apiId && (
              <Link
                to="/s/$pluginId/post/$apiId"
                params={{
                  pluginId: routePluginId,
                  apiId: comment.apiId,
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircleIcon className="h-3.5 w-3.5" />
              </Link>
            )}

            {comment.originalUrl && (
              <a
                href={comment.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="ml-2">
            {comment.comments?.length
              ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} platformType={platformType} routePluginId={routePluginId} />)
              : undefined}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentComponent;
