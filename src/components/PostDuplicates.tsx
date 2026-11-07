import Feed from "@/components/Feed";
import PostLink from "@/components/PostLink";
import { GetPostDuplicatesResponse } from "@/plugintypes";
import { Layers2Icon } from "lucide-react";
import React from "react";

type Props = {
  data: GetPostDuplicatesResponse;
  pluginId: string;
  sortId?: string;
};

/**
 * Old Reddit's "other discussions": the other posts of the same link, with
 * the original named in the header so the reader can get back to it.
 */
const PostDuplicates: React.FC<Props> = ({ data, pluginId, sortId }) => {
  const { post } = data;
  return (
    <Feed
      sortId={sortId}
      data={data}
      pageInfo={data.pageInfo}
      pluginId={pluginId}
      title={post?.title ? `Other discussions: ${post.title}` : "Other discussions"}
      emptyTitle="No other discussions"
      emptyDescription="Nobody else has posted this link."
      header={
        <div className="mb-3 min-w-0">
          <div className="flex items-center gap-2">
            <Layers2Icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <h1 className="text-xl font-bold">Other discussions</h1>
          </div>
          {post?.title && (
            <p className="mt-1 text-sm text-muted-foreground break-words">
              of{" "}
              <PostLink
                post={post}
                className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
              >
                {post.title}
              </PostLink>
              {post.communityName && <> in {post.communityName}</>}
            </p>
          )}
        </div>
      }
    />
  );
};

export default PostDuplicates;
