import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";

type Props = {
  comment: Post;
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
          params={{
            pluginId: comment.pluginId || "",
            apiId: comment.authorApiId || "",
          }}
        >
          {comment.authorName}
        </Link>
      </div>
    </div>
  );
};

export default CommentComponent;
