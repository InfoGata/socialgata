import React from "react";
import { useNavigate } from "@tanstack/react-router";
import type { HTMLReactParserOptions } from "html-react-parser";
import type { DOMNode } from "html-dom-parser";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import ReactTimeago from "react-timeago";
import { useImageboardPosts } from "@/contexts/ImageboardPostsContext";
import { replaceEmbeddedMedia } from "./EmbeddedImage";
import { imageboardPostAnchor } from "@/lib/imageboard-anchor";
import type { Post } from "@/plugintypes";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";

type Props = {
  postNumber: string;
  pluginId: string;
  communityApiId?: string;
  instanceId?: string;
  /**
   * Thread the quoted post is in. Plugins that predate it send only the post
   * number, which is then taken to be a thread of its own.
   */
  threadId?: string;
};

const ImageboardQuoteLink: React.FC<Props> = ({
  postNumber,
  pluginId,
  communityApiId,
  instanceId,
  threadId,
}) => {
  const navigate = useNavigate();
  const { getPostByNumber } = useImageboardPosts();
  const post = getPostByNumber(Number(postNumber));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const hash = imageboardPostAnchor(postNumber);

    // In this thread: move the url to the post, the way a board's own quote
    // links do. The thread scrolls to it and marks it, mounting it first if
    // it's further down than has been rendered. Same route, so no reload.
    if (post) {
      navigate({ to: ".", params: true, search: true, hash, resetScroll: false });
      return;
    }

    // Elsewhere: open the post's thread at the post.
    const apiId = threadId ?? postNumber;
    if (communityApiId && instanceId) {
      navigate({
        to: "/s/$pluginId/i/$instanceId/c/$communityId/post/$apiId",
        params: { pluginId, instanceId, communityId: communityApiId, apiId },
        hash,
      });
    } else if (communityApiId) {
      navigate({
        to: "/s/$pluginId/c/$communityId/post/$apiId",
        params: { pluginId, communityId: communityApiId, apiId },
        hash,
      });
    } else {
      navigate({
        to: "/s/$pluginId/post/$apiId",
        params: { pluginId, apiId },
        hash,
      });
    }
  };

  const link = (
    <a
      href="#"
      onClick={handleClick}
      className="text-primary hover:underline font-mono"
    >
      &gt;&gt;{postNumber}
    </a>
  );

  if (!post) {
    return link;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{link}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" side="top">
        <QuotePreview
          post={post}
          pluginId={pluginId}
          communityApiId={communityApiId}
          instanceId={instanceId}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

type PreviewProps = {
  post: Post;
  pluginId: string;
  communityApiId?: string;
  instanceId?: string;
};

/**
 * The quoted post inside a hover card. Its own quotes and backlinks are live
 * quote links, so a reply chain can be followed preview to preview the way a
 * board's own hover previews nest. Each card only mounts while it is open, so
 * the nesting costs nothing until someone hovers.
 */
const QuotePreview: React.FC<PreviewProps> = ({
  post,
  pluginId,
  communityApiId,
  instanceId,
}) => {
  const parseOptions = React.useMemo(
    () =>
      createImageboardParseOptions(
        pluginId,
        post.communityApiId ?? communityApiId,
        instanceId,
      ),
    [pluginId, post.communityApiId, communityApiId, instanceId],
  );
  const sanitizedBody = post.body ? DOMPurify.sanitize(post.body) : "";

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1.5 text-xs flex-wrap">
        <span className="font-semibold text-muted-foreground">
          {post.authorName || "Anonymous"}
        </span>
        {post.number && (
          <>
            <span className="text-muted-foreground">&middot;</span>
            <span className="text-muted-foreground font-mono">
              No. {post.number}
            </span>
          </>
        )}
        {post.publishedDate && (
          <>
            <span className="text-muted-foreground">&middot;</span>
            <span className="text-muted-foreground">
              <ReactTimeago date={post.publishedDate} />
            </span>
          </>
        )}
      </div>

      {/* Thumbnail */}
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt=""
          className="rounded w-16 h-16 object-cover float-left mr-2 mb-1"
        />
      )}

      {/* Body */}
      {sanitizedBody && (
        <div className="text-xs text-foreground line-clamp-4 whitespace-pre-wrap wrap-break-word">
          {parse(sanitizedBody, parseOptions)}
        </div>
      )}

      {post.number != null && (
        <ImageboardBacklinks
          number={post.number}
          pluginId={pluginId}
          communityApiId={post.communityApiId ?? communityApiId}
          instanceId={instanceId}
          className="clear-both mt-1.5 text-xs"
        />
      )}
    </>
  );
};

type BacklinksProps = {
  /** The post whose replies are listed. */
  number: number;
  pluginId: string;
  communityApiId?: string;
  instanceId?: string;
  className?: string;
};

/**
 * "Replies: >>1 >>2", the posts in this thread that quote this one. Each is a
 * quote link, so it previews on hover and jumps to the reply on click. Renders
 * nothing outside a thread, where no replies are known.
 */
export const ImageboardBacklinks: React.FC<BacklinksProps> = ({
  number,
  pluginId,
  communityApiId,
  instanceId,
  className = "",
}) => {
  const { getReplyNumbers } = useImageboardPosts();
  const replyNumbers = getReplyNumbers(number);
  if (replyNumbers.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-muted-foreground ${className}`}
      aria-label={`Replies to post ${number}`}
    >
      <span>Replies:</span>
      {replyNumbers.map((reply) => (
        <ImageboardQuoteLink
          key={reply}
          postNumber={String(reply)}
          pluginId={pluginId}
          communityApiId={communityApiId}
          instanceId={instanceId}
        />
      ))}
    </div>
  );
};

/** A plugin-written data attribute, which the plugin url-encodes. */
const decodeAttr = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
};

// eslint-disable-next-line react-refresh/only-export-components
export function createImageboardParseOptions(
  pluginId: string,
  communityApiId?: string,
  instanceId?: string,
): HTMLReactParserOptions {
  return {
    replace(domNode: DOMNode) {
      const media = replaceEmbeddedMedia(domNode);
      if (media) return media;

      if (
        domNode.type === "tag" &&
        (domNode as any).tagName === "a" &&
        (domNode as any).attribs?.href === "#"
      ) {
        const children = (domNode as any).children;
        const textChild = children?.[0];
        if (textChild?.type === "text" && textChild.data) {
          const match = textChild.data.match(/^>>(\d+)$/);
          if (match) {
            const attribs = (domNode as any).attribs ?? {};
            return (
              <ImageboardQuoteLink
                postNumber={match[1]}
                pluginId={pluginId}
                communityApiId={
                  decodeAttr(attribs["data-board-id"]) ?? communityApiId
                }
                instanceId={instanceId}
                threadId={decodeAttr(attribs["data-thread-id"])}
              />
            );
          }
        }
      }
    },
  };
}

export default ImageboardQuoteLink;
