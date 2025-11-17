import {
  Community,
  GetCommentsRequest,
  GetCommentsResponse,
  GetCommunitiesRequest,
  GetCommunitiesResponse,
  GetCommunityRequest,
  GetCommunityResponse,
  GetFeedRequest,
  GetFeedResponse,
  GetInstancesResponse,
  Instance,
  Post,
} from "@/plugintypes";
import { ServiceType } from "@/types";
import Imageboard from "imageboard/browser";
import type { Thread, Comment, ImageboardId, ImageboardOptionsWithHttpRequestFunction } from "imageboard";
import { createHttpRequestFunction } from "imageboard";
import { doesAttachmentHavePicture, getAttachmentThumbnailSize } from "social-components/attachment";

const pluginName = "imageboard";
const corsProxy = process.env.NODE_ENV === "development" ? "http://localhost:8085/" : "https://vercelcors-elijahgreen-info-gata.vercel.app/api?url=";

// Supported imageboards as instances (using library's supported IDs)
const SUPPORTED_IMAGEBOARDS: Instance[] = [
  {
    name: "4chan",
    description: "The most popular English-language imageboard",
    url: "https://4chan.org",
    bannerUrl: "https://s.4cdn.org/image/fp/logo-transparent.png",
    bannerSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#8DC63F" d="M172.2 507.4c-11.3-6.3-19.6-14.3-28.6-27.6-3.7-5.3-4.4-5.8-5.6-3.7-9.4 16.2-25.3 20.5-42.8 11.8-10.4-5.2-23.5-16.9-29.7-26.6-2.4-3.8-6.3-11.8-8.7-17.9-4.1-10.3-4.4-12.1-4.4-29.3 0-20.4 2.3-29.1 11.8-45.3 6.5-11.1 30.5-34.9 44.2-43.9 15.3-10 44.3-24.1 64-30.8 25.3-8.7 24.3-8.7 28.8-.8 10.5 18 21.5 42.5 29.3 65.3 12.1 35.6 14.2 82.8 5.1 111.5-3.9 12.5-11.4 24.9-19.4 32.4-8.9 8.3-11.8 9.4-25.2 9.4-9.5.1-11.7-.5-18.8-4.5zM376.4 481.6c-15.5-3.4-28.4-10.7-41.4-23.6-15.9-15.8-26.2-32.2-35.3-56.4-7.2-19-14.1-51.1-17-78.8l-.8-8.6 13.8-4.4c20.7-6.6 22.5-7.2 38.5-10.3 63.9-12.5 123.2-2 154.6 27.3 10.1 9.6 14.2 18.4 14.2 30.8 0 11-2 16-9.6 25-5.5 6.5-21.1 17.2-31.2 21.5-3.5 1.5-6.6 3-6.9 3.2-.4.3 1.5 2.8 4.4 5.8 6.9 7.2 8.2 10.1 8.2 18.8 0 10.4-5.1 20.1-15.6 29.8-19.6 18.4-48.5 25.8-75.9 19.9zM319.3 217c-19.3-45.6-26.4-76.4-26.4-115.1 0-29.4 3.8-47.4 14.5-69.6C317.9 10.1 331.5 0 350.8 0c12.2 0 21 4.1 30.8 14.2 7.3 7.9 16.2 20.5 17.9 26.3 1.1 3.2 1.3 3.1 8.6-3.8 7.9-7.5 13.5-9.4 23.2-8.2 20.8 2.8 42.9 28.6 49.2 57.4 2.5 11.4 1.3 33.6-2.7 44.7-6 17.4-19.8 35.6-36.6 47.8-24.2 17.7-54.2 30.5-93 39.7-23.8 5.5-26.1 5.5-28.9-1.1zM89.7 213.7c-26-3.4-51.9-14.1-66.4-27.6-11.8-11-14.1-15.8-14.1-30.4 0-11.4.3-12.1 5.5-20.4 6.2-9.4 15.5-17.4 29.4-25.2 5.2-2.8 9.7-5.3 10-5.6.4-.3-1.5-2.4-4.4-4.6-9.6-7.9-12.1-22.9-6-35.6 11.5-24.3 51.6-43.7 80.2-39 5.5.8 13.1 2.7 16.9 3.8 30.2 9.6 56 38.8 72.9 82.7 7.7 20 15.9 52 17.4 68.5l.7 8.2-6 2.5c-44.9 19.1-96.7 27.9-136.1 22.7z" data-fill="true"></path></svg>`,
    apiId: "4chan",
  },
  {
    name: "lainchan",
    description: "Cyberpunk and technology imageboard",
    url: "https://lainchan.org",
    apiId: "lainchan",
    bannerUrl: "https://lainchan.org/static/lain_banner1.png",
  },
  {
    name: "leftypol",
    description: "Leftist political imageboard",
    url: "https://leftypol.org",
    bannerUrl: "https://leftypol.org/static/leftypol_logo.png",
    apiId: "leftypol",
  },
  {
    name: "endchan",
    description: "Free speech imageboard",
    url: "https://endchan.net",
    bannerUrl: "https://anychans.github.io/assets/8e3fc4c9b8a090c7ea71e32701283479.png",
    apiId: "endchan",
  },
  {
    name: "2ch.hk",
    description: "Russian imageboard",
    url: "https://2ch.hk",
    bannerSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90.25 141.64" "><path fill="#fa8130" stroke="#6d6e71" stroke-miterlimit="10" stroke-width="0.5" d="M71.33 1.47c.4-.67.09-1.22-.69-1.22H35.87a2.81 2.81 0 0 0-2.16 1.21L.43 54.94c-.41.66-.11 1.2.67 1.2h36.7a1.08 1.08 0 0 1 1.1 1.38l-19.08 83.23c-.17.76.06.86.51.22l69.45-97.69c.45-.64.18-1.16-.6-1.16h-40.8c-.77 0-1.09-.55-.68-1.22Z" data-fill="true"></path></svg>`,
    apiId: "2ch",
  },
];

/**
 * Convert imageboard content to HTML
 * The content field from the imageboard library uses ContentBlock[][] from 'social-components'
 * (array of paragraphs, each paragraph is an array of content blocks)
 */
const contentToHtml = (content: unknown): string => {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    // Content is an array of paragraphs
    return content
      .map((paragraph: unknown) => {
        if (typeof paragraph === "string") return paragraph;
        if (Array.isArray(paragraph)) {
          // Each paragraph is an array of content blocks
          const paragraphHtml = paragraph
            .map((item: unknown) => {
              if (typeof item === "string") return item;
              if (typeof item === "object" && item !== null) {
                const obj = item as { type?: string; content?: string; url?: string; meta?: { boardId?: string; threadId?: number; postId?: number } };
                if (obj.type === "text") {
                  return obj.content || "";
                }
                if (obj.type === "link") {
                  const url = obj.url || "#";
                  const text = obj.content || url;
                  return `<a href="${url}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
                }
                if (obj.type === "quote") {
                  return `<span class="text-green-600">&gt;${obj.content || ""}</span>`;
                }
                if (obj.type === "post-link") {
                  const commentId = (obj.meta as { commentId?: number })?.commentId;
                  const postId = commentId ? String(commentId) : "";
                  return `<a href="#" class="text-primary hover:underline">&gt;&gt;${postId}</a>`;
                }
              }
              return "";
            })
            .join("");
          return paragraphHtml;
        }
        return "";
      })
      .join("<br>");
  }
  return "";
};

/**
 * Get instance base URL by instanceId
 */
const getInstanceUrl = (instanceId: string): string | undefined => {
  const instance = SUPPORTED_IMAGEBOARDS.find(ib => ib.apiId === instanceId);
  return instance?.url;
};

/**
 * Convert relative URL to absolute URL using instance base URL
 */
const toAbsoluteUrl = (url: string | undefined, instanceUrl: string | undefined): string | undefined => {
  if (!url) return undefined;
  if (!instanceUrl) return url;

  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If URL is protocol-relative (starts with //), add https:
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // If URL is relative, prepend instance base URL
  if (url.startsWith('/')) {
    return `${instanceUrl}${url}`;
  }

  // Otherwise assume it's a path without leading slash
  return `${instanceUrl}/${url}`;
};

/**
 * Extract image/video URL from attachment
 */
const getAttachmentUrl = (attachment: import("imageboard").Attachment, instanceUrl: string | undefined): string | undefined => {
  let url: string | undefined;

  if (attachment.type === "picture" && "picture" in attachment) {
    url = attachment.picture.url;
  } else if (attachment.type === "video" && "video" in attachment) {
    url = attachment.video.url;
  }

  return toAbsoluteUrl(url, instanceUrl);
};

/**
 * Convert imageboard thread to Post
 */
const imageboardThreadToPost = (
  thread: Thread,
  instanceId: string
): Post => {
  const instanceUrl = getInstanceUrl(instanceId);
  const firstComment = thread.comments?.[0];
	const thumbnailAttachment = firstComment?.attachments &&
			firstComment.attachments.filter(doesAttachmentHavePicture)[0]
  const thumbnail = thumbnailAttachment ? getAttachmentThumbnailSize(thumbnailAttachment) : undefined;
  const thumbnailUrl = toAbsoluteUrl(thumbnail?.url, instanceUrl);
  const firstAttachment = firstComment?.attachments?.[0];
  const attachmentUrl = firstAttachment ? getAttachmentUrl(firstAttachment, instanceUrl) : undefined;

  return {
    apiId: String(thread.id),
    title: thread.title || thread.autogeneratedTitle || `Thread #${thread.id}`,
    body: firstComment ? contentToHtml(firstComment.content) : undefined,
    publishedDate: thread.createdAt?.toISOString(),
    communityApiId: thread.boardId,
    communityName: `/${thread.boardId}/`,
    authorName: firstComment?.authorName || "Anonymous",
    authorApiId: firstComment?.authorId,
    pluginId: pluginName,
    instanceId: instanceId,
    thumbnailUrl: thumbnailUrl,
    url: attachmentUrl,
    numOfComments: thread.commentsCount,
    number: Number(thread.id),
  };
};

/**
 * Convert imageboard comment to Post (for comment trees)
 */
const imageboardCommentToPost = (
  comment: Comment,
  instanceId: string
): Post => {
  const instanceUrl = getInstanceUrl(instanceId);
  const thumbnailAttachment = comment.attachments &&
    comment.attachments.filter(doesAttachmentHavePicture)[0];
  const thumbnail = thumbnailAttachment ? getAttachmentThumbnailSize(thumbnailAttachment) : undefined;
  const thumbnailUrl = toAbsoluteUrl(thumbnail?.url, instanceUrl);
  const firstAttachment = comment.attachments?.[0];
  const attachmentUrl = firstAttachment ? getAttachmentUrl(firstAttachment, instanceUrl) : undefined;

  const bodyHtml = contentToHtml(comment.content);

  return {
    apiId: String(comment.id),
    body: bodyHtml,
    publishedDate: comment.createdAt?.toISOString(),
    authorName: comment.authorName || "Anonymous",
    authorApiId: comment.authorId,
    pluginId: pluginName,
    instanceId: instanceId,
    thumbnailUrl: thumbnailUrl,
    url: attachmentUrl,
    number: Number(comment.id),
  };
};

class ImageboardService implements ServiceType {
  platformType = "imageboard" as const;

  /**
   * Get list of supported imageboards as instances
   */
  async getInstances(): Promise<GetInstancesResponse> {
    return {
      instances: SUPPORTED_IMAGEBOARDS,
    };
  }

  private getImageboard = (instanceId: string): Imageboard => {
    const sendHttpRequest = createHttpRequestFunction({
      fetch: fetch,
      FormData: FormData,
      getRequestUrl: (parameters: { url: string }) => {
        return `${corsProxy}${parameters.url}`;
      },
    });
    const options: ImageboardOptionsWithHttpRequestFunction = {
      sendHttpRequest,
    }
    return Imageboard(instanceId as ImageboardId, 
      options,
    );
  }

  /**
   * Get feed of threads from a board
   */
  async getFeed(request: GetFeedRequest): Promise<GetFeedResponse> {
    const instanceId = request.instanceId || "4chan";
    let boardId = request.feedTypeId;

    try {
      // If no board specified, get the first available board from the instance
      if (!boardId) {
        const communitiesResponse = await this.getCommunities({ instanceId });
        if (communitiesResponse.items.length === 0) {
          throw new Error(`No boards available for ${instanceId}`);
        }
        boardId = communitiesResponse.items[0].apiId;
      }

      const imageboard = this.getImageboard(instanceId);

      // Check if imageboard supports getThreads
      if (!imageboard.getThreads) {
        throw new Error(`${instanceId} does not support getting threads`);
      }

      const threadsResponse = await imageboard.getThreads({
        boardId: boardId,
      });
      console.log(threadsResponse);

      const threads = threadsResponse.threads || [];
      const items = threads.map((thread) =>
        imageboardThreadToPost(thread, instanceId)
      );

      return {
        items,
        pageInfo: {
          page: 1,
        },
      };
    } catch (error) {
      console.error("Error fetching imageboard feed:", error);
      return {
        items: [],
        pageInfo: {},
      };
    }
  }

  /**
   * Get board info and threads
   */
  async getCommunity(request: GetCommunityRequest): Promise<GetCommunityResponse> {
    const instanceId = request.instanceId || "4chan";
    const boardId = request.apiId;

    try {
      const imageboard = this.getImageboard(instanceId);

      // Get threads for this board
      const threadsResponse = await imageboard.getThreads({
        boardId: boardId,
      });

      const threads = threadsResponse.threads || [];
      const items = threads.map((thread) =>
        imageboardThreadToPost(thread, instanceId)
      );

      // Use board info from response if available
      const boardInfo = threadsResponse.board;

      return {
        community: {
          apiId: boardId,
          name: boardId,
          instanceId: instanceId,
          description: boardInfo?.title || `/${boardId}/`,
        },
        items,
        pageInfo: {},
      };
    } catch (error) {
      console.error("Error fetching imageboard community:", error);
      return {
        community: {
          apiId: boardId,
          name: boardId,
          instanceId: instanceId,
          description: `/${boardId}/`,
        },
        items: [],
        pageInfo: {},
      };
    }
  }

  /**
   * Get list of all boards/communities for an imageboard instance
   */
  async getCommunities(request: GetCommunitiesRequest): Promise<GetCommunitiesResponse> {
    const instanceId = request.instanceId || "4chan";

    try {
      const imageboard = this.getImageboard(instanceId);

      // Check if imageboard supports getBoards
      if (!imageboard.getBoards) {
        throw new Error(`${instanceId} does not support getting boards`);
      }

      const boardsResponse = await imageboard.getBoards();
      const boards = boardsResponse.boards || [];

      const communities: Community[] = boards.map((board) => ({
        apiId: board.id,
        name: board.id,
        instanceId: instanceId,
        description: board.title || `/${board.id}/`,
      }));

      return {
        items: communities,
        pageInfo: {},
      };
    } catch (error) {
      console.error("Error fetching imageboard communities:", error);
      return {
        items: [],
        pageInfo: {},
      };
    }
  }

  /**
   * Get thread with all comments
   */
  async getComments(request: GetCommentsRequest): Promise<GetCommentsResponse> {
    const instanceId = request.instanceId || "4chan";
    const threadId = request.apiId;
    const boardId = request.communityId;

    if (!threadId || !boardId) {
      throw new Error("Both threadId and boardId are required");
    }

    try {
      const imageboard = this.getImageboard(instanceId);

      const threadResponse = await imageboard.getThread({
        boardId: boardId,
        threadId: Number(threadId),
      });
      console.log(threadResponse);

      const thread = threadResponse.thread;
      const instanceUrl = getInstanceUrl(instanceId);

      // First comment is the OP (original post)
      const opComment = thread.comments?.[0];
      const firstAttachment = opComment?.attachments?.[0];
      const attachmentUrl = firstAttachment ? getAttachmentUrl(firstAttachment, instanceUrl) : undefined;

      const post: Post = {
        apiId: String(thread.id),
        title: thread.title || thread.autogeneratedTitle || `Thread #${thread.id}`,
        body: opComment ? contentToHtml(opComment.content) : undefined,
        publishedDate: thread.createdAt?.toISOString(),
        communityApiId: thread.boardId,
        communityName: `/${thread.boardId}/`,
        authorName: opComment?.authorName || "Anonymous",
        authorApiId: opComment?.authorId,
        pluginId: pluginName,
        instanceId: instanceId,
        thumbnailUrl: attachmentUrl,
        url: attachmentUrl,
        numOfComments: thread.commentsCount,
        number: Number(thread.id),
      };

      // Rest are comments (skip first comment which is OP)
      const comments = thread.comments?.slice(1) || [];
      const items = comments.map((comment) =>
        imageboardCommentToPost(comment, instanceId)
      );

      return {
        post,
        items,
        community: {
          apiId: boardId,
          name: boardId,
          instanceId: instanceId,
          description: threadResponse.board?.title || `/${boardId}/`,
        },
        pageInfo: {},
      };
    } catch (error) {
      console.error("Error fetching imageboard comments:", error);
      throw error;
    }
  }
}

export default new ImageboardService();
