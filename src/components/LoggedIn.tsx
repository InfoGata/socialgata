import RedditService from "@/services/reddit";
import { Button } from "@/components/ui/button";
import { Post } from "@/plugintypes";
import React from "react";
import PostComponent from "./PostComponent";

type Props = {
  accessToken: string;
};

const LogginedIn: React.FC<Props> = (props) => {
  const { accessToken } = props;
  const [posts, setPosts] = React.useState<Post[]>([]);
  const getRedditHome = async () => {
    const service = new RedditService();
    const response = await service.getHome(accessToken);
    setPosts(response.items);
  };
  return (
    <div>
      <Button onClick={getRedditHome}>Get Home</Button>
      {posts.map((p) => (
        <PostComponent key={p.title} post={p} />
      ))}
    </div>
  );
};

export default LogginedIn;
