import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "./ui/button";
import { MessageCircleIcon } from "lucide-react";
import ReactTimeago from "react-timeago";
import PostLink from "./PostLink";
import React from "react";
import ImageThumbnail from "./ImageThumbnail";
import parse from 'html-react-parser';
import DOMPurify from "dompurify";
import ExpandedMedia from "./ExpandedMedia";

type Props = {
  post: Post;
  instanceId?: string;
  showFullPost?: boolean;
};

const ImageboardPost: React.FC<Props> = ({ post, instanceId, showFullPost = false }) => {
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const sanitizer = DOMPurify.sanitize;

  return (
    <div className="group relative bg-card rounded-lg border hover:border-primary/50 transition-all duration-200">
      <div className="p-3">
        <div className="flex gap-3">
          {/* Thumbnail */}
          {(post.thumbnailUrl || post.url) && (
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
                    to="/plugins/$pluginId/community/$apiId"
                    className="font-bold text-primary hover:underline"
                    params={{
                      pluginId: post.pluginId || "",
                      apiId: post.communityApiId || "",
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
              <div className="text-sm text-foreground mb-2 line-clamp-4">
                <div className="whitespace-pre-wrap break-words">
                  {parse(sanitizer(post.body))}
                </div>
              </div>
            )}

            {/* Expanded Media */}
            {(expand || showFullPost) && post.url && (
              <ExpandedMedia
                url={post.url}
                thumbnailUrl={post.thumbnailUrl}
                alt={post.title || "Thread image"}
                className="rounded-md mb-2 max-w-full"
              />
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-2 mt-2">
              {post.numOfComments !== undefined && (
                <PostLink
                  post={post}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm"
                  }) + " h-7 px-2 py-1"}
                  instanceId={instanceId}
                >
                  <MessageCircleIcon className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs font-medium">
                    {numberFormatter.format(post.numOfComments)} replies
                  </span>
                </PostLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageboardPost;
