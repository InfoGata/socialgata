import React from "react";
import { Post } from "@/plugintypes";
import { PlatformType } from "@/types";
import MicroblogPost from "./MicroblogPost";
import ImageboardPost from "./ImageboardPost";
import ForumPost from "./ForumPost";
import NsfwGate from "./NsfwGate";

type Props = {
  post: Post;
  instanceId?: string;
  platformType?: PlatformType;
  showFullPost?: boolean;
  /**
   * Whether the community this post came from is marked adult. Sources like
   * imageboards classify the board and leave the posts unflagged, so the
   * community's mark has to reach the post or nothing in it gets gated.
   */
  communityNsfw?: boolean;
};

const PostComponent: React.FC<Props> = ({ post, instanceId, platformType = "forum", showFullPost = false, communityNsfw }) => {
  const layout = () => {
    // Microblog layout (Twitter-like for Bluesky, Mastodon)
    if (platformType === "microblog") {
      return <MicroblogPost post={post} instanceId={instanceId} showFullPost={showFullPost} />;
    }

    // Imageboard layout (for 4chan, 8kun, etc.)
    if (platformType === "imageboard") {
      return <ImageboardPost post={post} instanceId={instanceId} />;
    }

    // Forum layout (for Reddit, Lemmy, HackerNews)
    return <ForumPost post={post} instanceId={instanceId} showFullPost={showFullPost} />;
  };

  // Gated here rather than at each call site: this is the one funnel every post
  // renders through, so a new caller is covered without having to remember.
  return <NsfwGate nsfw={post.nsfw || communityNsfw}>{layout()}</NsfwGate>;
};

export default PostComponent;
