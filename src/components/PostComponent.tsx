import React from "react";
import { Post } from "@/plugintypes";
import { PlatformType } from "@/types";
import MicroblogPost from "./MicroblogPost";
import ImageboardPost from "./ImageboardPost";
import ForumPost from "./ForumPost";

type Props = {
  post: Post;
  instanceId?: string;
  platformType?: PlatformType;
  showFullPost?: boolean;
};

const PostComponent: React.FC<Props> = ({ post, instanceId, platformType = "forum", showFullPost = false }) => {
  // Microblog layout (Twitter-like for Bluesky, Mastodon)
  if (platformType === "microblog") {
    return <MicroblogPost post={post} instanceId={instanceId} showFullPost={showFullPost} />;
  }

  // Imageboard layout (for 4chan, 8kun, etc.)
  if (platformType === "imageboard") {
    return <ImageboardPost post={post} instanceId={instanceId} showFullPost={showFullPost} />;
  }

  // Forum layout (for Reddit, Lemmy, HackerNews)
  return <ForumPost post={post} instanceId={instanceId} showFullPost={showFullPost} />;
};

export default PostComponent;
