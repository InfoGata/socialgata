import { Link } from "@tanstack/react-router";
import { LinkIcon } from "lucide-react";
import React from "react";

/**
 * Everything needed to address a comment by url. Comment permalinks live under
 * the post the comment belongs to, the way Reddit's do, so building one needs
 * the post (and instance/community, when the url has them) as well as the
 * comment.
 */
export type CommentPermalinkContext = {
  pluginId: string;
  postApiId: string;
  communityId?: string;
  instanceId?: string;
};

/**
 * A permalink context plus what the favorites page needs to label the backlink
 * and render the comment the way its platform does. Stored on a favorited
 * comment, since nothing on the comment itself names the post it came from.
 */
export type FavoriteCommentSource = CommentPermalinkContext & {
  postTitle?: string;
  platformType?: string;
};

type PermalinkProps = {
  context: CommentPermalinkContext;
  commentApiId: string;
  className?: string;
};

/** Link to a single comment thread — the comment's permalink. */
export const CommentPermalink: React.FC<PermalinkProps> = (props) => {
  const { context, commentApiId, className } = props;
  const { pluginId, postApiId, communityId, instanceId } = context;
  const label = "Permalink";
  const icon = <LinkIcon className="h-3.5 w-3.5" />;

  if (communityId && instanceId) {
    return (
      <Link
        to="/s/$pluginId/i/$instanceId/c/$communityId/post/$apiId/comment/$commentId"
        params={{
          pluginId,
          instanceId,
          communityId,
          apiId: postApiId,
          commentId: commentApiId,
        }}
        className={className}
        title={label}
        aria-label={label}
      >
        {icon}
      </Link>
    );
  }

  if (communityId) {
    return (
      <Link
        to="/s/$pluginId/c/$communityId/post/$apiId/comment/$commentId"
        params={{
          pluginId,
          communityId,
          apiId: postApiId,
          commentId: commentApiId,
        }}
        className={className}
        title={label}
        aria-label={label}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Link
      to="/s/$pluginId/post/$apiId/comment/$commentId"
      params={{ pluginId, apiId: postApiId, commentId: commentApiId }}
      className={className}
      title={label}
      aria-label={label}
    >
      {icon}
    </Link>
  );
};

type FullThreadProps = {
  context: CommentPermalinkContext;
  className?: string;
  children: React.ReactNode;
};

/** Link back to every comment on the post, from a single comment thread. */
export const FullThreadLink: React.FC<FullThreadProps> = (props) => {
  const { context, className, children } = props;
  const { pluginId, postApiId, communityId, instanceId } = context;

  if (communityId && instanceId) {
    return (
      <Link
        to="/s/$pluginId/i/$instanceId/c/$communityId/post/$apiId"
        params={{
          pluginId,
          instanceId,
          communityId,
          apiId: postApiId,
        }}
        className={className}
      >
        {children}
      </Link>
    );
  }

  if (communityId) {
    return (
      <Link
        to="/s/$pluginId/c/$communityId/post/$apiId"
        params={{ pluginId, communityId, apiId: postApiId }}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      to="/s/$pluginId/post/$apiId"
      params={{ pluginId, apiId: postApiId }}
      className={className}
    >
      {children}
    </Link>
  );
};
