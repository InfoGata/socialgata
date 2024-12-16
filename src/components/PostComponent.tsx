import { Post } from "@/plugintypes";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Button, buttonVariants } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon, MessageCircleIcon } from "lucide-react";
import ReactTimeago from "react-timeago";
import PostLink from "./PostLink";

type Props = {
  post: Post;
};
const PostComponent: React.FC<Props> = (props) => {
  const { post } = props;
  return (
    <div className="rounded-lg border p-2 hover:bg-accent transition-colors flex gap-2">
      <p> {post.number} </p>
      <div>
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
        {
          <PostLink post={post} isTitleLink className="text-lg font-semibold">
            {post.title}
          </PostLink>
        }
        {post.thumbnailUrl && (
          <img src={post.thumbnailUrl} className="rounded-md" />
        )}
        <div className="flex items-center">
          {post.score && (
            <div className="flex items-center">
              <Button variant="ghost" size="icon" disabled={true}>
                <ArrowDownIcon />
              </Button>
              <p>{post.score}</p>
              <Button variant="ghost" size="icon" disabled={true}>
                <ArrowUpIcon />
              </Button>
            </div>
          )}
          {post.numOfComments !== undefined && (
            <PostLink
              post={post}
              className={buttonVariants({ variant: "ghost" })}
            >
              <MessageCircleIcon />
              <p>{post.numOfComments}</p>
            </PostLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostComponent;
