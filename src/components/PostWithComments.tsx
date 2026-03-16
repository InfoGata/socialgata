import { GetCommentsResponse, Post } from "@/plugintypes";
import PostComponent from "./PostComponent";
import CommentComponent from "./CommentComponent";
import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { usePlugins } from "@/hooks/usePlugins";
import { MessageCircleIcon, Users2Icon } from "lucide-react";
import { ImageboardPostsProvider } from "@/contexts/ImageboardPostsContext";

interface Props {
  data: GetCommentsResponse;
  pluginId?: string;
}

const PostWithComments: React.FC<Props> = (props) => {
  const { data, pluginId } = props;
  const [replies, setReplies] = React.useState<Post[] | null>(null);
  const { plugins } = usePlugins();
  const plugin = pluginId ? plugins.find(p => p.id === pluginId) : null;
  const platformType = plugin?.platformType || "forum";

  const getReplies = async () => {
    if (!pluginId || !data.post?.moreRepliesId || !plugin) return;

    if (!await plugin.hasDefined.onGetCommentReplies()) return;
    const repliesResponse = await plugin.remote.onGetCommentReplies({
      apiId: data.post.moreRepliesId,
      instanceId: data.post.instanceId,
      communityApiId: data.post.communityApiId,
      postApiId: data.post.apiId,
    });
    setReplies(repliesResponse.items);
  }


  const allPosts = React.useMemo(() => {
    const posts: Post[] = [];
    if (data.post) posts.push(data.post);
    posts.push(...data.items);
    if (replies) posts.push(...replies);
    return posts;
  }, [data.post, data.items, replies]);

  const content = (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <title>{data.post?.title}</title>

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
            <PostComponent post={data.post} platformType={platformType} showFullPost={true} />
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
              <CommentComponent key={d.apiId} comment={d} platformType={platformType} />
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
              <CommentComponent key={r.apiId} comment={r} platformType={platformType} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (platformType === "imageboard") {
    return (
      <ImageboardPostsProvider posts={allPosts}>
        {content}
      </ImageboardPostsProvider>
    );
  }

  return content;
};

export default PostWithComments;
