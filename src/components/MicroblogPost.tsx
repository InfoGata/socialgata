import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { MessageCircleIcon, Heart, ExternalLinkIcon } from "lucide-react";
import ReactTimeago from "react-timeago";
import PostLink from "./PostLink";
import React from "react";
import ImageThumbnail from "./ImageThumbnail";
import ExpandedMedia from "./ExpandedMedia";
import PostBody from "./PostBody";
import { htmlToText } from "@/lib/post-body-links";
import { FavoriteButton } from "./FavoriteButton";

type Props = {
  post: Post;
  instanceId?: string;
  showFullPost?: boolean;
};

// A tweet that this post quotes, rendered inline as a nested card rather than
// as a separate standalone post.
const QuotedPost: React.FC<{ post: Post; pluginId: string }> = ({
  post,
  pluginId,
}) => {
  return (
    <div className="mt-2 mb-2 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden">
      <div className="p-3">
        {/* Header: Author & Time */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <Avatar className="size-5">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback className="text-[10px]">
              {post.authorName?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <Link
            to="/s/$pluginId/user/$apiId"
            className="font-semibold text-xs hover:underline"
            params={{
              pluginId: post.pluginId || pluginId,
              apiId: post.authorApiId || "",
            }}
          >
            {post.authorName}
          </Link>
          {post.authorApiId && (
            <span className="text-muted-foreground text-xs">
              @{post.authorApiId}
            </span>
          )}
          {post.publishedDate && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <PostLink
                post={{ ...post, pluginId: post.pluginId || pluginId }}
                className="text-muted-foreground text-xs hover:underline"
              >
                <ReactTimeago date={post.publishedDate} />
              </PostLink>
            </>
          )}
        </div>

        {/* Body */}
        {post.body && (
          <div className="text-sm">
            <PostBody
              body={post.body}
              pluginId={post.pluginId || pluginId}
              className="whitespace-pre-wrap break-words"
            />
          </div>
        )}
      </div>

      {/* Media */}
      {post.thumbnailUrl && (
        <div className="border-t">
          <ImageThumbnail
            url={post.url}
            thumbnailUrl={post.thumbnailUrl}
            toggleExpand={() => {}}
          />
        </div>
      )}
    </div>
  );
};

const MicroblogPost: React.FC<Props> = ({ post, instanceId, showFullPost = false }) => {
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });

  return (
    <div className="group relative bg-card rounded-lg border hover:border-primary/50 transition-all duration-200">
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Link
            to="/s/$pluginId/user/$apiId"
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
                to="/s/$pluginId/user/$apiId"
                className="font-semibold text-sm hover:underline"
                params={{
                  pluginId: post.pluginId || "",
                  apiId: post.authorApiId || "",
                }}
              >
                {post.authorName}
              </Link>
              {post.publishedDate && (
                <>
                  <span className="text-muted-foreground text-sm">•</span>
                  <PostLink
                    post={post}
                    instanceId={instanceId}
                    className="text-muted-foreground text-sm hover:underline"
                  >
                    <ReactTimeago date={post.publishedDate} />
                  </PostLink>
                </>
              )}
            </div>

            {/* Post Body */}
            <div className="text-sm mb-2">
              {post.body && (
                <PostBody
                  body={post.body}
                  pluginId={post.pluginId || ""}
                  className="whitespace-pre-wrap break-words"
                />
              )}
            </div>

            {/* Quoted Tweet */}
            {post.quotedPost && (
              <QuotedPost
                post={post.quotedPost}
                pluginId={post.pluginId || ""}
              />
            )}

            {/* Image/Media */}
            {(post.thumbnailUrl || post.url) && (
              <div className="mb-2 rounded-xl overflow-hidden border">
                <ImageThumbnail
                  url={post.url}
                  thumbnailUrl={post.thumbnailUrl}
                  isVideo={post.isVideo}
                  toggleExpand={toggleExpand}
                />
              </div>
            )}

            {/* Expanded Media */}
            {(expand || showFullPost) && (post.url || post.videoSources?.length) && (
              <ExpandedMedia
                url={post.url ?? ""}
                isVideo={post.isVideo}
                videoSources={post.videoSources}
                thumbnailUrl={post.thumbnailUrl}
                alt={post.body ? htmlToText(post.body) : "Post media"}
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

              {post.originalUrl && (
                <a
                  href={post.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors group/action"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">original</span>
                </a>
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
