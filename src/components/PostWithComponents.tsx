import { GetCommentsResponse, Post } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { getService } from "@/services/selector-service";
import { MessageCircleIcon, Users2Icon } from "lucide-react";

interface Props {
  data: GetCommentsResponse;
  pluginId?: string;
}

const PostWithComponents: React.FC<Props> = (props) => {
  const { data, pluginId } = props;
  const [replies, setReplies] = React.useState<Post[] | null>(null);
  const getReplies = async () => {
    if (!pluginId || !data.post?.moreRepliesId) return;

    const service = getService(pluginId);
    if (!service || !service.getCommentReplies) return;
    const replies = await service.getCommentReplies({
      apiId: data.post.moreRepliesId,
      instanceId: data.post.instanceId,
      communityApiId: data.post.communityApiId,
      postApiId: data.post.apiId,
    });
    setReplies(replies.items);
  }


  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <Helmet>
        <title>{data.post?.title}</title>
      </Helmet>
      
      {/* Community Header */}
      {data.community && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users2Icon className="h-4 w-4" />
              <span>Community: <span className="font-medium text-foreground">{data.community.name}</span></span>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Post */}
      {data.post && (
        <Card>
          <CardContent className="p-0">
            <PostComponent post={data.post} />
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      {data.items.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                Comments ({data.items.length})
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {data.items.map((d) => (
              <CommentComponent key={d.apiId} comment={d} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Load More Replies */}
      {data.post?.moreRepliesId && !replies && (
        <div className="flex justify-center pt-4">
          <Button 
            onClick={getReplies}
            variant="outline"
            className="min-w-[200px]"
          >
            Load more replies
          </Button>
        </div>
      )}

      {/* Additional Replies */}
      {replies && replies.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <h3 className="text-lg font-semibold">
              Additional Replies ({replies.length})
            </h3>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {replies.map((r) => (
              <CommentComponent key={r.apiId} comment={r} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostWithComponents;
