import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import React, { PropsWithChildren } from "react";

type Props = {
  post: Post;
  isTitleLink?: boolean;
  className?: string
}

const PostLink: React.FC<PropsWithChildren<Props>> = (props) => {
  const { post, isTitleLink, className, children } = props;
  return isTitleLink && post.url ? (
    <a className={className} href={post.url}>
      {children}
    </a>
  ) : post.communityApiId ? (
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
  ) : (
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