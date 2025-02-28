import { GetCommentsResponse, Post } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "./ui/button";
import { getService } from "@/services/selector-service";

interface Props {
  data: GetCommentsResponse;
  pluginId?: string;
}

const PostWithComponents: React.FC<Props> = (props) => {
  const { data, pluginId } = props;
  const [replies, setReplies] = React.useState<Post[] | null>(null);
  const getReplies = async () => {
    if (!pluginId || !data.post?.moreRepliesId) return;

    const service = getService(pluginId);
    if (!service || !service.getCommentReplies) return;
    const replies = await service.getCommentReplies({
      apiId: data.post.moreRepliesId,
      instanceId: data.post.instanceId,
      communityApiId: data.post.communityApiId,
      postApiId: data.post.apiId,
    });
    setReplies(replies.items);
  }


  return (
    <div>
      <Helmet>
        <title>{data.post?.title}</title>
      </Helmet>
      {data.community && <span>Community: {data.community?.name}</span>}
      {data.post && <PostComponent post={data.post} />}
      <div>
        {data.items.map((d) => (
          <CommentComponent key={d.apiId} comment={d} />
        ))}
      </div>
      {data.post?.moreRepliesId && !replies && (
        <div>
          <Button onClick={getReplies}>Load more replies</Button>
        </div>
      )}
      {replies && replies.length > 0 && (
        <div>
          {replies.map((r) => (
            <CommentComponent key={r.apiId} comment={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostWithComponents;
