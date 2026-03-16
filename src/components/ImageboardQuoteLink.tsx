import React from "react";
import { useNavigate } from "@tanstack/react-router";
import type { HTMLReactParserOptions } from "html-react-parser";
import type { DOMNode } from "html-dom-parser";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import ReactTimeago from "react-timeago";
import { useImageboardPosts } from "@/contexts/ImageboardPostsContext";
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
};

const ImageboardQuoteLink: React.FC<Props> = ({
  postNumber,
  pluginId,
  communityApiId,
  instanceId,
}) => {
  const navigate = useNavigate();
  const { getPostByNumber } = useImageboardPosts();
  const post = getPostByNumber(Number(postNumber));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Try to scroll to the referenced post on the current page
    const target = document.querySelector(`[data-post-number="${postNumber}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("ring-2", "ring-primary");
      setTimeout(() => target.classList.remove("ring-2", "ring-primary"), 2000);
      return;
    }

    // Navigate to the post's page
    if (communityApiId && instanceId) {
      navigate({
        to: "/plugins/$pluginId/instances/$instanceId/community/$communityId/post/$apiId",
        params: { pluginId, instanceId, communityId: communityApiId, apiId: postNumber },
      });
    } else if (communityApiId) {
      navigate({
        to: "/plugins/$pluginId/community/$communityId/post/$apiId",
        params: { pluginId, communityId: communityApiId, apiId: postNumber },
      });
    } else {
      navigate({
        to: "/plugins/$pluginId/post/$apiId",
        params: { pluginId, apiId: postNumber },
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

  const sanitizedBody = post.body ? DOMPurify.sanitize(post.body) : "";

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{link}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" side="top">
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
          <div className="text-xs text-foreground line-clamp-4 whitespace-pre-wrap break-words">
            {parse(sanitizedBody)}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export function createImageboardParseOptions(
  pluginId: string,
  communityApiId?: string,
  instanceId?: string,
): HTMLReactParserOptions {
  return {
    replace(domNode: DOMNode) {
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
            return (
              <ImageboardQuoteLink
                postNumber={match[1]}
                pluginId={pluginId}
                communityApiId={communityApiId}
                instanceId={instanceId}
              />
            );
          }
        }
      }
    },
  };
}

export default ImageboardQuoteLink;
