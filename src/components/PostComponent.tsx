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

type Props = {
  post: Post;
  instanceId?: string;
};


const PostComponent: React.FC<Props> = (props) => {
  const { post, instanceId } = props;
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  }
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const sanitizer = DOMPurify.sanitize;
  return (
    <div className="group relative bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="flex gap-3 p-3">
        {/* Post Number & Thumbnail */}
        <div className="flex gap-2 items-start">
          {post.number && (
            <span className="text-lg font-bold text-muted-foreground/50 min-w-[1.5rem] text-right">
              {post.number}
            </span>
          )}
          <div className="rounded-md size-16 bg-muted overflow-hidden flex-shrink-0">
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
          <div className="flex items-center gap-1.5 mb-1 text-xs">
            {post.authorAvatar && (
              <Avatar className="size-5">
                <AvatarImage src={post.authorAvatar} />
                <AvatarFallback className="text-[10px]">{post.authorName?.slice(0, 2)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-wrap items-center gap-x-1 text-muted-foreground">
              <Link
                to="/plugins/$pluginId/user/$apiId"
                className="font-medium hover:text-foreground transition-colors"
                params={{
                  pluginId: post.pluginId || "",
                  apiId: post.authorApiId || "",
                }}
              >
                {post.authorName}
              </Link>
              {post.communityName && (
                <>
                  <span>in</span>
                  <Link
                    to="/plugins/$pluginId/community/$apiId"
                    className="font-medium hover:text-foreground transition-colors"
                    params={{
                      pluginId: post.pluginId || "",
                      apiId: post.communityApiId || "",
                    }}
                  >
                    {post.communityName}
                  </Link>
                </>
              )}
              <span>•</span>
              <span>
                {post.publishedDate && <ReactTimeago date={post.publishedDate} />}
              </span>
            </div>
          </div>

          {/* Title */}
          <PostLink
            post={post}
            isTitleLink
            className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2"
            instanceId={instanceId}
          >
            {post.title}
          </PostLink>

          {/* Body */}
          {post.body && (
            <div className="text-sm text-muted-foreground mb-2 line-clamp-3">
              {parse(sanitizer(post.body))}
            </div>
          )}

          {/* Expanded Image */}
          {expand && (
            <img
              src={post.url}
              className="rounded-md mb-2 max-w-full"
              alt={post.title}
            />
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-1">
            {post.score !== undefined && (
              <div className="flex items-center rounded-md bg-muted/50 px-1.5 py-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:text-orange-500"
                  disabled={true}
                >
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                </Button>
                <span className="px-1.5 font-medium text-xs min-w-[3ch] text-center">
                  {numberFormatter.format(post.score)}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:text-blue-500"
                  disabled={true}
                >
                  <ArrowDownIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            
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
                  {numberFormatter.format(post.numOfComments)}
                </span>
              </PostLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComponent;
