import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import React, { PropsWithChildren } from "react";

type Props = {
  post: Post;
  isTitleLink?: boolean;
  className?: string
  instanceId?: string;
}

const PostLink: React.FC<PropsWithChildren<Props>> = (props) => {
  const { post, isTitleLink, className, children, instanceId } = props;

  if (isTitleLink && post.url) {
    return (
      <a className={className} href={post.url} target="_blank">
        {children}
      </a>
    );
  }

  if (post.communityApiId && !instanceId) {
    return (
      <Link
        className={className}
      to="/plugins/$pluginId/community/$communityId/post/$apiId"
      params={{
        pluginId: post.pluginId || "",
        communityId: post.communityApiId,
        apiId: post.apiId || "",
      }}
    >
      {children}
      </Link>
    );
  }

  if (post.communityApiId && instanceId) {
    return (
      <Link
        className={className}
        to="/plugins/$pluginId/instances/$instanceId/community/$communityId/post/$apiId"
        params={{
          pluginId: post.pluginId || "",
          instanceId: instanceId,
          communityId: post.communityApiId,
          apiId: post.apiId || "",
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      className={className}
      to="/plugins/$pluginId/post/$apiId"
      params={{ pluginId: post.pluginId || "", apiId: post.apiId || "" }}
    >
      {children}
    </Link>
  );
}

export default PostLink;