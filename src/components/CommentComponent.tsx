import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import Markdown from "react-markdown";

type Props = {
  comment: Post;
};

const CommentComponent: React.FC<Props> = (props) => {
  const { comment } = props;
  return (
    <div className="border-y border-l-2 ml-1 py-1 pl-1">
      <div>
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
      <div>
        <Markdown
          components={{
            a(props) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { node, ...rest } = props;
              return (
                <a
                  className="text-blue-600 dark:text-blue-500 hover:underline"
                  {...rest}
                />
              );
            },
          }}
        >
          {comment.body}
        </Markdown>
      </div>
      <div>
        {comment.counts && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <ArrowDownIcon />
            </Button>
            <p>{comment.counts.upvotes}</p>
            <Button variant="ghost" size="icon">
              <ArrowUpIcon />
            </Button>
          </div>
        )}
      </div>
      <div className="ml-2">
        {comment.comments?.length
          ? comment.comments.map((c) => <CommentComponent comment={c} />)
          : undefined}
      </div>
    </div>
  );
};

export default CommentComponent;
