import { GetCommentsResponse } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";
import React from "react";
import { Helmet } from "react-helmet-async";

interface Props {
  data: GetCommentsResponse;
}

const PostWithComponents: React.FC<Props> = (props) => {
  const { data } = props;
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
    </div>
  );
};

export default PostWithComponents;
