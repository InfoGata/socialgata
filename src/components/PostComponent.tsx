import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon, MessageCircleIcon } from "lucide-react";
import ReactTimeago from "react-timeago";

type Props = {
  post: Post;
};
const PostComponent: React.FC<Props> = (props) => {
  const { post } = props;
  return (
    <div className="border-y py-2">
      <div className="flex gap-2 items-center">
        {post.authorAvatar && (
          <Avatar>
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback>{post.authorName?.slice(0, 2)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex gap-1 items-center">
          <Link
            to="/plugins/$pluginId/user/$apiId"
            className="font-semibold"
            params={{
              pluginId: post.pluginId || "",
              apiId: post.authorApiId || "",
            }}
          >
            {post.authorName}
          </Link>
          {post.communityName && (
            <div>
              <span>to</span>
              <Link
                to="/plugins/$pluginId/community/$apiId"
                className="font-semibold"
                params={{
                  pluginId: post.pluginId || "",
                  apiId: post.communityApiId || "",
                }}
              >
                {post.communityName}
              </Link>
            </div>
          )}
          <p className="text-xs">
            {post.publishedDate && <ReactTimeago date={post.publishedDate} />}
          </p>
        </div>
      </div>
      {post.communityApiId ? (
        <Link
          className="leading-snug whitespace-pre-line"
          to="/plugins/$pluginId/community/$communityId/post/$apiId"
          params={{
            pluginId: post.pluginId || "",
            communityId: post.communityApiId,
            apiId: post.apiId || "",
          }}
        >
          {post.title}
        </Link>
      ) : (
        <Link
          className="leading-snug whitespace-pre-line"
          to="/plugins/$pluginId/post/$apiId"
          params={{ pluginId: post.pluginId || "", apiId: post.apiId || "" }}
        >
          {post.title}
        </Link>
      )}
      {post.thumbnailUrl && (
        <img src={post.thumbnailUrl} className="rounded-md" />
      )}
      <div className="flex items-center">
        {post.score && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <ArrowDownIcon />
            </Button>
            <p>{post.score}</p>
            <Button variant="ghost" size="icon">
              <ArrowUpIcon />
            </Button>
          </div>
        )}
        {post.numOfComments && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <MessageCircleIcon />
            </Button>
            <p>{post.numOfComments}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComponent;
