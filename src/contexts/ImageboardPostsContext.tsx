import React from "react";
import { Post } from "@/plugintypes";

interface ImageboardPostsContextValue {
  getPostByNumber: (num: number) => Post | undefined;
  /**
   * Numbers of the posts in this thread that quote post `num`, in thread
   * order: the "Replies:" backlinks a board shows under a post.
   */
  getReplyNumbers: (num: number) => readonly number[];
}

const noReplies: readonly number[] = [];

const ImageboardPostsContext = React.createContext<ImageboardPostsContextValue>({
  getPostByNumber: () => undefined,
  getReplyNumbers: () => noReplies,
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

/**
 * A quote link as the imageboard plugin writes it:
 * `<a href="#" data-thread-id=".." data-board-id="..">&gt;&gt;123</a>`. Same
 * shape `createImageboardParseOptions` turns into a quote link, so a quote is
 * a backlink exactly when it renders as a quote.
 */
const quoteLinkPattern = /<a\b([^>]*)>(?:&gt;|>){2}(\d+)<\/a>/gi;
const hashHrefPattern = /\bhref\s*=\s*["']#["']/i;

const readAttr = (attrs: string, name: string): string | undefined => {
  const match = attrs.match(
    new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"),
  );
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
};

/**
 * The post numbers a body quotes in this thread, without repeats. A quote
 * naming another thread or board is a link elsewhere, not a reply here; one
 * naming neither comes from a plugin that predates those attributes and is
 * taken to be in this thread.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function quotedNumbers(
  body: string,
  thread: { number?: number; boardId?: string },
): number[] {
  const numbers: number[] = [];
  if (!body.includes("&gt;&gt;") && !body.includes(">>")) return numbers;
  for (const [, attrs, num] of body.matchAll(quoteLinkPattern)) {
    if (!hashHrefPattern.test(attrs)) continue;
    const threadId = readAttr(attrs, "data-thread-id");
    if (threadId && thread.number != null && threadId !== String(thread.number)) {
      continue;
    }
    const boardId = readAttr(attrs, "data-board-id");
    if (boardId && thread.boardId && boardId !== thread.boardId) continue;
    const n = Number(num);
    if (!numbers.includes(n)) numbers.push(n);
  }
  return numbers;
}

export const ImageboardPostsProvider: React.FC<{
  posts: Post[];
  /** The OP's number, which same-thread quotes carry as their thread id. */
  threadNumber?: number;
  boardId?: string;
  children: React.ReactNode;
}> = ({ posts, threadNumber, boardId, children }) => {
  const { postMap, replyMap } = React.useMemo(() => {
    const flat = flattenPosts(posts);
    const postMap = new Map<number, Post>();
    for (const post of flat) {
      if (post.number != null) {
        postMap.set(post.number, post);
      }
    }

    // Built after every post is known, so a quote of a post further down
    // (rare, but boards allow it) still counts, and a quote of a post that
    // isn't here -- deleted, or past what was fetched -- doesn't.
    const replyMap = new Map<number, number[]>();
    const thread = { number: threadNumber, boardId };
    for (const post of flat) {
      if (post.number == null || !post.body) continue;
      for (const quoted of quotedNumbers(post.body, thread)) {
        if (quoted === post.number || !postMap.has(quoted)) continue;
        const replies = replyMap.get(quoted);
        if (replies) {
          if (!replies.includes(post.number)) replies.push(post.number);
        } else {
          replyMap.set(quoted, [post.number]);
        }
      }
    }
    return { postMap, replyMap };
  }, [posts, threadNumber, boardId]);

  const getPostByNumber = React.useCallback(
    (num: number) => postMap.get(num),
    [postMap],
  );

  const getReplyNumbers = React.useCallback(
    (num: number) => replyMap.get(num) ?? noReplies,
    [replyMap],
  );

  const value = React.useMemo(
    () => ({ getPostByNumber, getReplyNumbers }),
    [getPostByNumber, getReplyNumbers],
  );

  return (
    <ImageboardPostsContext.Provider value={value}>
      {children}
    </ImageboardPostsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useImageboardPosts() {
  return React.useContext(ImageboardPostsContext);
}
