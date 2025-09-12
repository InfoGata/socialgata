import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon, MessageCircleIcon } from "lucide-react";
import ReactTimeago from "react-timeago";
import PostLink from "./PostLink";
import React from "react";
import ImageThumbnail from "./ImageThumbnail";

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
  return (
    <div className="group relative bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="flex gap-4 p-4">
        {/* Post Number & Thumbnail */}
        <div className="flex gap-3 items-start">
          {post.number && (
            <span className="text-2xl font-bold text-muted-foreground/50 min-w-[2rem] text-right">
              {post.number}
            </span>
          )}
          <div className="rounded-md size-20 bg-muted overflow-hidden flex-shrink-0">
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
          <div className="flex items-center gap-2 mb-2 text-sm">
            {post.authorAvatar && (
              <Avatar className="size-6">
                <AvatarImage src={post.authorAvatar} />
                <AvatarFallback className="text-xs">{post.authorName?.slice(0, 2)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
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
              <span className="text-xs">
                {post.publishedDate && <ReactTimeago date={post.publishedDate} />}
              </span>
            </div>
          </div>

          {/* Title */}
          <PostLink
            post={post}
            isTitleLink
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-3"
            instanceId={instanceId}
          >
            {post.title}
          </PostLink>

          {/* Expanded Image */}
          {expand && (
            <img 
              src={post.url} 
              className="rounded-md mb-3 max-w-full" 
              alt={post.title}
            />
          )}

          {/* Actions Bar */}
          <div className="flex items-center gap-1">
            {post.score !== undefined && (
              <div className="flex items-center rounded-md bg-muted/50 px-2 py-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 hover:text-orange-500"
                  disabled={true}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
                <span className="px-2 font-medium text-sm min-w-[3ch] text-center">
                  {numberFormatter.format(post.score)}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 hover:text-blue-500"
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
                })}
                instanceId={instanceId}
              >
                <MessageCircleIcon className="h-4 w-4" />
                <span className="ml-1.5 font-medium">
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
