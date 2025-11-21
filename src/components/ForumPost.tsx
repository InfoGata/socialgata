import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon, MessageCircleIcon } from "lucide-react";
import ReactTimeago from "react-timeago";
import PostLink from "./PostLink";
import React from "react";
import ImageThumbnail from "./ImageThumbnail";
import parse from 'html-react-parser';
import DOMPurify from "dompurify";
import ExpandedMedia from "./ExpandedMedia";
import { FavoriteButton } from "./FavoriteButton";

type Props = {
  post: Post;
  instanceId?: string;
  showFullPost?: boolean;
};

const ForumPost: React.FC<Props> = ({ post, instanceId, showFullPost = false }) => {
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const sanitizer = DOMPurify.sanitize;

  return (
    <div className="group relative bg-card rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-lg shadow-sm transition-all duration-300 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Post Number & Thumbnail */}
        <div className="flex gap-3 items-start">
          {post.number && (
            <span className="text-xl font-bold text-muted-foreground/40 min-w-[2rem] text-right pt-1">
              {post.number}
            </span>
          )}
          <div className="rounded-lg size-20 bg-muted/50 overflow-hidden flex-shrink-0 ring-1 ring-border/40 hover:ring-primary/30 transition-all">
            <ImageThumbnail
              url={post.url}
              thumbnailUrl={post.thumbnailUrl}
              toggleExpand={toggleExpand}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Author & Community Info */}
          <div className="flex items-center gap-2 mb-2 text-xs">
            {post.authorAvatar && (
              <Avatar className="size-6 ring-2 ring-border/40">
                <AvatarImage src={post.authorAvatar} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                  {post.authorName?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
              <Link
                to="/plugins/$pluginId/user/$apiId"
                className="font-semibold hover:text-primary transition-colors"
                params={{
                  pluginId: post.pluginId || "",
                  apiId: post.authorApiId || "",
                }}
              >
                {post.authorName}
              </Link>
              {post.communityName && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <Link
                    to="/plugins/$pluginId/community/$apiId"
                    className="font-medium hover:text-primary transition-colors"
                    params={{
                      pluginId: post.pluginId || "",
                      apiId: post.communityApiId || "",
                    }}
                  >
                    {post.communityName}
                  </Link>
                </>
              )}
              <span className="text-muted-foreground/60">•</span>
              <span className="text-muted-foreground/80">
                {post.publishedDate && <ReactTimeago date={post.publishedDate} />}
              </span>
            </div>
          </div>

          {/* Title */}
          <PostLink
            post={post}
            isTitleLink
            className="text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2 leading-tight"
            instanceId={instanceId}
          >
            {post.title}
          </PostLink>

          {/* Body */}
          {post.body && (
            <div className="text-sm text-muted-foreground/90 mb-3 line-clamp-3 leading-relaxed">
              {parse(sanitizer(post.body))}
            </div>
          )}

          {/* Expanded Media */}
          {(expand || showFullPost) && post.url && (
            <ExpandedMedia
              url={post.url}
              isVideo={post.isVideo}
              thumbnailUrl={post.thumbnailUrl}
              alt={post.title || "Post media"}
              className="rounded-lg mb-3 max-w-full shadow-md"
            />
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-2">
            {post.score !== undefined && (
              <div className="flex items-center rounded-lg bg-muted/60 border border-border/40 px-2 py-1 hover:bg-muted/80 transition-colors">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-orange-500 hover:bg-orange-500/10"
                  disabled={true}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
                <span className="px-2 font-bold text-sm min-w-[3ch] text-center">
                  {numberFormatter.format(post.score)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-blue-500 hover:bg-blue-500/10"
                  disabled={true}
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {post.numOfComments !== undefined && (
              <PostLink
                post={post}
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm"
                }) + " h-8 px-3 py-2 rounded-lg border border-border/40 hover:bg-muted/60 hover:border-primary/30"}
                instanceId={instanceId}
              >
                <MessageCircleIcon className="h-4 w-4" />
                <span className="ml-1.5 text-sm font-semibold">
                  {numberFormatter.format(post.numOfComments)}
                </span>
              </PostLink>
            )}

            {post.pluginId && post.apiId && (
              <FavoriteButton
                type="post"
                item={post}
                pluginId={post.pluginId}
                size="sm"
                className="h-8 w-8 border border-border/40 hover:border-primary/30"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;
