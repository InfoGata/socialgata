import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { MessageCircleIcon, Heart } from "lucide-react";
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

const MicroblogPost: React.FC<Props> = ({ post, instanceId, showFullPost = false }) => {
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const sanitizer = DOMPurify.sanitize;

  return (
    <div className="group relative bg-card rounded-lg border hover:border-primary/50 transition-all duration-200">
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Link
            to="/plugins/$pluginId/user/$apiId"
            params={{
              pluginId: post.pluginId || "",
              apiId: post.authorApiId || "",
            }}
          >
            <Avatar className="size-10 hover:opacity-80 transition-opacity">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback>{post.authorName?.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </Link>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Author & Time */}
            <div className="flex items-center gap-1 mb-1 flex-wrap">
              <Link
                to="/plugins/$pluginId/user/$apiId"
                className="font-semibold text-sm hover:underline"
                params={{
                  pluginId: post.pluginId || "",
                  apiId: post.authorApiId || "",
                }}
              >
                {post.authorName}
              </Link>
              <span className="text-muted-foreground text-sm">•</span>
              <span className="text-muted-foreground text-sm">
                {post.publishedDate && <ReactTimeago date={post.publishedDate} />}
              </span>
            </div>

            {/* Post Body */}
            <div className="text-sm mb-2">
              {post.body && (
                <div className="whitespace-pre-wrap break-words">
                  {parse(sanitizer(post.body))}
                </div>
              )}
            </div>

            {/* Image/Media */}
            {(post.thumbnailUrl || post.url) && (
              <div className="mb-2 rounded-xl overflow-hidden border">
                <ImageThumbnail
                  url={post.url}
                  thumbnailUrl={post.thumbnailUrl}
                  toggleExpand={toggleExpand}
                />
              </div>
            )}

            {/* Expanded Media */}
            {(expand || showFullPost) && post.url && (
              <ExpandedMedia
                url={post.url}
                thumbnailUrl={post.thumbnailUrl}
                alt={post.body || "Post media"}
                className="rounded-xl mb-2 max-w-full border"
              />
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-6 mt-3 text-muted-foreground">
              {post.numOfComments !== undefined && (
                <PostLink
                  post={post}
                  className="flex items-center gap-1 hover:text-primary transition-colors group/action"
                  instanceId={instanceId}
                >
                  <MessageCircleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {numberFormatter.format(post.numOfComments)}
                  </span>
                </PostLink>
              )}

              {post.score !== undefined && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-pink-500 hover:bg-pink-500/10"
                    disabled={true}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium">
                    {numberFormatter.format(post.score)}
                  </span>
                </div>
              )}

              {post.pluginId && post.apiId && (
                <FavoriteButton
                  type="post"
                  item={post}
                  pluginId={post.pluginId}
                  size="sm"
                  className="h-8 w-8"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicroblogPost;
