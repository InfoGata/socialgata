import { PostComment } from "@/plugintypes";
import { Link } from "@tanstack/react-router";

type Props = {
  comment: PostComment;
};
const CommentComponent: React.FC<Props> = (props) => {
  const { comment } = props;
  return (
    <div>
      <div>{comment.body}</div>
      <div>
        by{" "}
        <Link
          to="/plugins/$pluginId/user/$apiId"
          params={{ pluginId: "reddit", apiId: comment.authorApiId || "" }}
        >
          {comment.authorName}
        </Link>
      </div>
    </div>
  );
};

export default CommentComponent;
