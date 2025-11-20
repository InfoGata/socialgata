import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import parse from 'html-react-parser';
import DOMPurify from "dompurify";
import React from "react";
import ImageThumbnail from "./ImageThumbnail";
import ExpandedMedia from "./ExpandedMedia";
import ReactTimeago from "react-timeago";
import { FavoriteButton } from "./FavoriteButton";

type Props = {
  comment: Post;
  platformType?: string;
};

const CommentComponent: React.FC<Props> = (props) => {
  const { comment, platformType = "forum" } = props;
  const [expand, setExpand] = React.useState(false);
  const toggleExpand = () => {
    setExpand(!expand);
  };
  const sanitizer = DOMPurify.sanitize;

  const clean = sanitizer(comment.body || "");

  // Imageboard-style rendering
  if (platformType === "imageboard") {
    return (
      <div className="border-l-2 border-muted pl-4 my-4">
        {/* Expanded Media - Full Width Above Content */}
        {expand && comment.url && comment.thumbnailUrl && (
          <div className="mb-3">
            <ExpandedMedia
              url={comment.url}
              thumbnailUrl={comment.thumbnailUrl}
              alt={comment.title || "Reply image"}
              className="rounded-md max-w-full border w-full"
              toggleExpand={toggleExpand}
            />
          </div>
        )}

        <div className="flex gap-3">
          {/* Thumbnail - Only shown when not expanded */}
          {!expand && comment.thumbnailUrl && (
            <div className="rounded-md w-24 h-24 bg-muted overflow-hidden flex-shrink-0">
              <ImageThumbnail
                url={comment.url}
                thumbnailUrl={comment.thumbnailUrl}
                toggleExpand={toggleExpand}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Author, Post Number & Time */}
            <div className="flex items-center gap-1.5 mb-2 text-xs flex-wrap">
              <span className="font-semibold text-muted-foreground">
                {comment.authorName || "Anonymous"}
              </span>

              {comment.number && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground font-mono">
                    No. {comment.number}
                  </span>
                </>
              )}

              {comment.publishedDate && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    <ReactTimeago date={comment.publishedDate} />
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            {comment.title && (
              <div className="text-sm font-bold text-foreground mb-2">
                {comment.title}
              </div>
            )}

            {/* Body */}
            {comment.body && (
              <div className="text-sm text-foreground">
                <div className="whitespace-pre-wrap break-words">
                  {parse(clean)}
                </div>
              </div>
            )}

            {/* Favorite Button */}
            {comment.pluginId && comment.apiId && (
              <div className="mt-2">
                <FavoriteButton
                  type="comment"
                  item={comment}
                  pluginId={comment.pluginId}
                  size="sm"
                  className="h-7 w-7"
                />
              </div>
            )}
          </div>
        </div>

        {/* Nested replies */}
        <div className="ml-2">
          {comment.comments?.length
            ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} platformType={platformType} />)
            : undefined}
        </div>
      </div>
    );
  }

  // Forum/default style rendering
  return (
    <div className="border-l-2 border-muted pl-4 my-4">
      <div className="text-sm text-muted-foreground mb-2">
        <Link
          to="/plugins/$pluginId/user/$apiId"
          params={{
            pluginId: comment.pluginId || "",
            apiId: comment.authorApiId || "",
          }}
        >
          {comment.authorName}
        </Link>
      </div>
      <div>
        {parse(clean)}
      </div>
      <div className="flex items-center gap-2">
        {comment.score && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <ArrowDownIcon />
            </Button>
            <p>{comment.score}</p>
            <Button variant="ghost" size="icon">
              <ArrowUpIcon />
            </Button>
          </div>
        )}

        {comment.pluginId && comment.apiId && (
          <FavoriteButton
            type="comment"
            item={comment}
            pluginId={comment.pluginId}
            size="sm"
            className="h-7 w-7"
          />
        )}
      </div>
      <div className="ml-2">
        {comment.comments?.length
          ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} platformType={platformType} />)
          : undefined}
      </div>
    </div>
  );
};

export default CommentComponent;
