import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "./ui/button";
import { MessageCircleIcon, ExternalLinkIcon } from "lucide-react";
import ReactTimeago from "react-timeago";
import PostLink from "./PostLink";
import React from "react";
import parse from 'html-react-parser';
import DOMPurify from "dompurify";
import ImageThumbnail from "./ImageThumbnail";
import ExpandedMedia from "./ExpandedMedia";
import { FavoriteButton } from "./FavoriteButton";
import { createImageboardParseOptions } from "./ImageboardQuoteLink";

type Props = {
  post: Post;
  instanceId?: string;
};

const ImageboardPost: React.FC<Props> = ({ post, instanceId }) => {
  const [expand, setExpand] = React.useState(false);
  const parseOptions = React.useMemo(
    () => createImageboardParseOptions(post.pluginId || "", post.communityApiId, instanceId),
    [post.pluginId, post.communityApiId, instanceId],
  );
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const sanitizer = DOMPurify.sanitize;

  return (
    <div className="group relative bg-card rounded-lg border hover:border-primary/50 transition-all duration-200 overflow-hidden" data-post-number={post.number}>
      <div className="p-3">
        {/* Expanded Media - Full Width Above Content */}
        {expand && post.url && post.thumbnailUrl && (
          <div className="mb-3">
            <ExpandedMedia
              url={post.url}
              thumbnailUrl={post.thumbnailUrl}
              alt={post.title || "Thread image"}
              className="rounded-md max-w-full border w-full"
              toggleExpand={toggleExpand}
            />
          </div>
        )}

        <div className="flex gap-3">
          {/* Thumbnail - Only shown when not expanded */}
          {!expand && post.thumbnailUrl && (
            <div className="rounded-md w-32 h-32 bg-muted overflow-hidden flex-shrink-0">
              <ImageThumbnail
                url={post.url}
                thumbnailUrl={post.thumbnailUrl}
                toggleExpand={toggleExpand}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Board, Post Number, Author & Time */}
            <div className="flex items-center gap-1.5 mb-2 text-xs flex-wrap">
              {post.communityName && (
                <>
                  <Link
                    to={instanceId
                      ? "/plugins/$pluginId/instances/$instanceId/community/$apiId"
                      : "/plugins/$pluginId/community/$apiId"
                    }
                    className="font-bold text-primary hover:underline"
                    params={{
                      pluginId: post.pluginId || "",
                      apiId: post.communityApiId || "",
                      ...(instanceId ? { instanceId } : {}),
                    }}
                  >
                    {post.communityName}
                  </Link>
                  <span className="text-muted-foreground">•</span>
                </>
              )}

              <span className="font-semibold text-muted-foreground">
                {post.authorName || "Anonymous"}
              </span>

              {post.number && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground font-mono">
                    No. {post.number}
                  </span>
                </>
              )}

              {post.publishedDate && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    <ReactTimeago date={post.publishedDate} />
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            {post.title && (
              <PostLink
                post={post}
                isTitleLink
                className="text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2 block"
                instanceId={instanceId}
              >
                {post.title}
              </PostLink>
            )}

            {/* Body */}
            {post.body && (
              <div className="text-sm text-foreground mb-2 overflow-hidden">
                <div className="whitespace-pre-wrap break-words line-clamp-4">
                  {parse(sanitizer(post.body), parseOptions)}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-2 mt-2">
              {post.numOfComments !== undefined && (
                <PostLink
                  post={post}
                  className={
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    }) + " h-7 px-2 py-1"
                  }
                  instanceId={instanceId}
                >
                  <MessageCircleIcon className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs font-medium">
                    {numberFormatter.format(post.numOfComments)} replies
                  </span>
                </PostLink>
              )}

              {post.originalUrl && (
                <a
                  href={post.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    }) + " h-7 px-2 py-1"
                  }
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs font-medium">original</span>
                </a>
              )}

              {post.pluginId && post.apiId && (
                <FavoriteButton
                  type="post"
                  item={post}
                  pluginId={post.pluginId}
                  size="sm"
                  className="h-7 w-7"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageboardPost;
