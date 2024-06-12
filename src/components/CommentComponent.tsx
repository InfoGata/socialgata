import { Post } from "@/plugintypes";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import parse from 'html-react-parser';
import DOMPurify from "dompurify";

type Props = {
  comment: Post;
};

const CommentComponent: React.FC<Props> = (props) => {
  const { comment } = props;
  const sanitizer = DOMPurify.sanitize;
  const clean = sanitizer(comment.body || "");
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
        {parse(clean)}
      </div>
      <div>
        {comment.score && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon">
              <ArrowDownIcon />
            </Button>
            <p>{comment.score}</p>
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
