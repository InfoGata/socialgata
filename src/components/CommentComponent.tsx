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
    <div className="border-l-2 border-muted pl-4 my-4">
      <div className="text-sm text-muted-foreground mb-2">
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
          ? comment.comments.map((c) => <CommentComponent key={c.apiId} comment={c} />)
          : undefined}
      </div>
    </div>
  );
};

export default CommentComponent;
