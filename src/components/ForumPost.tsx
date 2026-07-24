import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { ArrowUpIcon, ArrowDownIcon, MessageCircleIcon, ExternalLinkIcon } from "lucide-react";
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

const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp|svg|ico|tiff|tif|raw|heic|heif|avif))/i;

const ForumPost: React.FC<Props> = ({ post, instanceId, showFullPost = false }) => {
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => setExpand(!expand);
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const sanitizer = DOMPurify.sanitize;
  const hasThumbnail = !!post.thumbnailUrl || (post.url && imageRegex.test(post.url));
  const isExternal = post.url && !post.url.startsWith('/');
  // Videos may carry sources without a usable `url` (it points at a player page).
  const hasExpandableMedia =
    !!post.videoSources?.length ||
    (!!post.url && (post.isVideo || imageRegex.test(post.url)));

  return (
    <div className="group relative bg-card hover:bg-accent/30 rounded-lg border border-border/50 hover:border-border transition-colors duration-150">
      <div className="flex">
        {/* Vote Column */}
        {post.score != null && (
          <div className="flex flex-col items-center justify-start gap-0.5 px-2.5 py-3 bg-muted/30 rounded-l-lg border-r border-border/30 min-w-[52px]">
            <ArrowUpIcon className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-xs font-bold text-foreground/80">
              {numberFormatter.format(post.score)}
            </span>
            <ArrowDownIcon className="h-4 w-4 text-muted-foreground/50" />
            {post.upvoteRatio != null && (
              <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                {Math.round(post.upvoteRatio * 100)}%
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 px-3 py-2.5">
          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            {post.number && (
              <span className="font-bold text-muted-foreground/50 mr-1">
                #{post.number}
              </span>
            )}
            {post.authorAvatar && (
              <Avatar className="size-4">
                <AvatarImage src={post.authorAvatar} />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {post.authorName?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
            <Link
              to="/s/$pluginId/user/$apiId"
              className="font-medium hover:text-primary transition-colors"
              params={{
                pluginId: post.pluginId || "",
                apiId: post.authorApiId || "",
              }}
            >
              {post.authorName}
            </Link>
            {post.communityName && (
              <>
                <span className="text-muted-foreground/40">in</span>
                <Link
                  to={instanceId
                    ? "/s/$pluginId/i/$instanceId/c/$apiId"
                    : "/s/$pluginId/c/$apiId"
                  }
                  className="font-semibold text-primary/80 hover:text-primary transition-colors"
                  params={{
                    pluginId: post.pluginId || "",
                    apiId: post.communityApiId || "",
                    ...(instanceId ? { instanceId } : {}),
                  }}
                >
                  {post.communityName}
                </Link>
              </>
            )}
            {post.publishedDate && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-muted-foreground/60">
                  <ReactTimeago date={post.publishedDate} />
                </span>
              </>
            )}
            {post.edited && (
              <span className="text-muted-foreground/50 italic">· edited</span>
            )}
          </div>

          {/* Flair & content badges */}
          {(post.flair || post.nsfw || post.spoiler || post.locked || post.stickied) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {post.stickied && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-green-500/15 text-green-600 dark:text-green-400">
                  Pinned
                </span>
              )}
              {post.flair && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary">
                  {post.flair}
                </span>
              )}
              {post.nsfw && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-destructive/15 text-destructive">
                  NSFW
                </span>
              )}
              {post.spoiler && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
                  Spoiler
                </span>
              )}
              {post.locked && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Locked
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <div className="flex items-start gap-1.5 mb-1">
            <PostLink
              post={post}
              isTitleLink
              className={`text-[15px] font-semibold text-foreground hover:text-primary transition-colors leading-snug ${showFullPost ? "" : "line-clamp-2"}`}
              instanceId={instanceId}
            >
              {post.title}
            </PostLink>
            {isExternal && (
              <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Body */}
          {post.body &&
            (showFullPost ? (
              <div className="md-body text-sm text-foreground/90 leading-relaxed mb-2">
                {parse(sanitizer(post.body))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed mb-1.5">
                {parse(sanitizer(post.body))}
              </div>
            ))}

          {/* Expanded Media */}
          {(expand || showFullPost) && hasExpandableMedia && (
            <ExpandedMedia
              url={post.url ?? ""}
              isVideo={post.isVideo}
              videoSources={post.videoSources}
              thumbnailUrl={post.thumbnailUrl}
              alt={post.title || "Post media"}
              className="rounded-lg mb-2 max-w-full"
              toggleExpand={toggleExpand}
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {post.numOfComments !== undefined && (
              <PostLink
                post={post}
                className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                instanceId={instanceId}
              >
                <MessageCircleIcon className="h-3.5 w-3.5" />
                <span>{numberFormatter.format(post.numOfComments)} comments</span>
              </PostLink>
            )}

            {!showFullPost && post.originalUrl && (
              <a
                href={post.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                <span>original</span>
              </a>
            )}

            {post.pluginId && post.apiId && (
              <FavoriteButton
                type="post"
                item={post}
                pluginId={post.pluginId}
                size="sm"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
              />
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {hasThumbnail && (
          <div className="flex-shrink-0 p-2.5 pl-0">
            <div className="rounded-md size-16 sm:size-[72px] bg-muted/40 overflow-hidden ring-1 ring-border/30">
              <ImageThumbnail
                url={post.url}
                thumbnailUrl={post.thumbnailUrl}
                isVideo={post.isVideo}
                toggleExpand={toggleExpand}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumPost;
