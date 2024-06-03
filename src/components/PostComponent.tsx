import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";

type Props = {
  post: Post;
};
const PostComponent: React.FC<Props> = (props) => {
  const { post } = props;
  return (
    <div>
      <div className="text-2xl">
        <Link
          to="/plugins/$pluginId/community/$communityId/comments/$apiId"
          params={{
            pluginId: post.pluginId || "",
            communityId: post.communityApiId || "",
            apiId: post.apiId || "",
          }}
        >
          {post.title}
        </Link>
      </div>
      <div>
        in{" "}
        <Link
          to="/plugins/$pluginId/community/$apiId"
          params={{
            pluginId: post.pluginId || "",
            apiId: post.communityApiId || "",
          }}
        >
          {post.communityName}
        </Link>
      </div>
      <div>
        by{" "}
        <Link
          to="/plugins/$pluginId/user/$apiId"
          params={{
            pluginId: post.pluginId || "",
            apiId: post.authorApiId || "",
          }}
        >
          {post.authorName}
        </Link>
      </div>
    </div>
  );
};

export default PostComponent;
