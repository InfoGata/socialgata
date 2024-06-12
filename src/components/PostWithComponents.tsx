import { GetCommentsResponse } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";

interface Props {
  data: GetCommentsResponse;
}

const PostWithComponents: React.FC<Props> = (props) => {
  const { data } = props;
  return (
    <div>
      {data.community && <span>Community: {data.community?.name}</span>}
      {data.post && <PostComponent post={data.post} />}
      <div>
        {data.items.map((d) => (
          <CommentComponent comment={d} />
        ))}
      </div>
    </div>
  );
};

export default PostWithComponents;
