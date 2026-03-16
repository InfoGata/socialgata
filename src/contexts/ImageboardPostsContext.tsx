import React from "react";
import { Post } from "@/plugintypes";

interface ImageboardPostsContextValue {
  getPostByNumber: (num: number) => Post | undefined;
}

const ImageboardPostsContext = React.createContext<ImageboardPostsContextValue>({
  getPostByNumber: () => undefined,
});

function flattenPosts(posts: Post[]): Post[] {
  const result: Post[] = [];
  for (const post of posts) {
    result.push(post);
    if (post.comments?.length) {
      result.push(...flattenPosts(post.comments));
    }
  }
  return result;
}

export const ImageboardPostsProvider: React.FC<{
  posts: Post[];
  children: React.ReactNode;
}> = ({ posts, children }) => {
  const postMap = React.useMemo(() => {
    const map = new Map<number, Post>();
    for (const post of flattenPosts(posts)) {
      if (post.number != null) {
        map.set(post.number, post);
      }
    }
    return map;
  }, [posts]);

  const getPostByNumber = React.useCallback(
    (num: number) => postMap.get(num),
    [postMap],
  );

  const value = React.useMemo(
    () => ({ getPostByNumber }),
    [getPostByNumber],
  );

  return (
    <ImageboardPostsContext.Provider value={value}>
      {children}
    </ImageboardPostsContext.Provider>
  );
};

export function useImageboardPosts() {
  return React.useContext(ImageboardPostsContext);
}
