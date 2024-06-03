import { Button } from "@/components/ui/button";
import { Post } from "@/plugintypes";
import { getService } from "@/services/selector-service";
import React from "react";
import PostComponent from "./PostComponent";

type Props = {
  pluginId: string;
};

const LogginedIn: React.FC<Props> = (props) => {
  const { pluginId } = props;
  const [posts, setPosts] = React.useState<Post[]>([]);
  const getRedditHome = async () => {
    const service = getService(pluginId);
    if (service) {
      const response = await service.getFeed();
      setPosts(response.items);
    }
  };
  return (
    <div>
      <Button onClick={getRedditHome}>Get Feed</Button>
      {posts.map((p) => (
        <PostComponent key={p.title} post={p} />
      ))}
    </div>
  );
};

export default LogginedIn;
