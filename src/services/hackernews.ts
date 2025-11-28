import { GetCommentsRequest, GetCommentsResponse, GetFeedRequest, GetFeedResponse, GetUserReponse, GetUserRequest, Post, SearchRequest, SearchResponse } from "@/plugintypes";
import { ServiceType } from "@/types";
import { initializeApp } from "firebase/app"
import { getDatabase, ref, child, get, query, orderByKey } from "firebase/database"

const pluginName = "hackernews";
const hackerNewsUrl = "https://news.ycombinator.com"
const algoliaUrl = "https://hn.algolia.com/api/v1";
interface FirebaseStory {
  by: string;
  descendants: number;
  id: number;
  kids: number[];
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
}

interface AlgoriaSearch {
  hits: (AlgoriaCommentHit | AlgoriaStoryHit)[];
  hitsPerPage: number;
  nbHits: number;
  nbPages: number;
  page: number;
}

interface AlgoriaCommentHit {
  story_title: string;
  story_id: number;
  parent_id: number;
  comment_text: string;
  author: string;
  created_at: string;
  objectID: string;
}

interface AlgoriaStoryHit {
  author: string;
  points: number;
  story_id: string;
  title: string;
  created_at: string;
  url: string;
  num_comments: number;
  objectID: string;
}

interface AlgoriaItemData {
  author: string;
  children: AlgoriaCommentItem[];
  created_at: string;
  id: number;
}

interface AlgoriaStoryItem extends AlgoriaItemData {
  type: "story";
  title: string;
  url: string;
  points: number;
}

interface AlgoriaCommentItem extends AlgoriaItemData {
  type: "comment";
  text: string;
  parent_id: number;
}

const firebaseUrl = "https://hacker-news.firebaseio.com";
const firebaseConfig = {
  databaseURL: firebaseUrl
};

const firebaseApp = initializeApp(firebaseConfig);
const db = ref(getDatabase(firebaseApp));

async function getStory(id: number): Promise<FirebaseStory> {
  const path = `/v0/item/${id}.json`;
  const url = `${firebaseUrl}${path}`;
  const response = await fetch(url);
  const json: FirebaseStory = await response.json();
  return json;
}

const firebaseStoryToPost = (story: FirebaseStory): Post => {
  return {
    apiId: story.id.toString(),
    title: story.title,
    publishedDate: new Date(story.time * 1000).toISOString(),
    url: story.url,
    authorName: story.by,
    authorApiId: story.by,
    originalUrl: `${hackerNewsUrl}/item?id=${story.id}`,
    score: story.score,
    numOfComments: story.descendants,
    pluginId: pluginName
  }
}

const algoliaCommentToPost = (comment: AlgoriaCommentItem): Post => {
  return {
    apiId: comment.id.toString(),
    body: comment.text,
    publishedDate: comment.created_at,
    authorName: comment.author,
    authorApiId: comment.author,
    originalUrl: `${hackerNewsUrl}/item?id=${comment.id}`,
    parentId: comment.parent_id.toString(),
    comments: comment.children.map(algoliaCommentToPost),
    pluginId: pluginName
  }
}


const algoliaStoryToPost = (story: AlgoriaStoryItem): Post => {
  return {
    apiId: story.id.toString(),
    title: story.title,
    publishedDate: story.created_at,
    url: story.url,
    authorName: story.author,
    authorApiId: story.author,
    originalUrl: `${hackerNewsUrl}/item?id=${story.id}`,
    score: story.points,
    pluginId: pluginName
  }
}

const algoliaStoryHitToPost = (story: AlgoriaStoryHit): Post => {
  return {
    apiId: story.objectID,
    title: story.title,
    publishedDate: story.created_at,
    url: story.url,
    authorName: story.author,
    authorApiId: story.author,
    originalUrl: `${hackerNewsUrl}/item?id=${story.objectID}`,
    score: story.points,
    numOfComments: story.num_comments,
    pluginId: pluginName
  }
}

const algoliaCommentHitToPost = (comment: AlgoriaCommentHit): Post => {
  return {
    apiId: comment.objectID,
    body: comment.comment_text,
    publishedDate: comment.created_at,
    authorName: comment.author,
    authorApiId: comment.author,
    parentId: comment.parent_id.toString(),
    originalUrl: `${hackerNewsUrl}/item?id=${comment.objectID}`,
    pluginId: pluginName
  }
}

class HackerNewsService implements ServiceType {
  platformType = "forum" as const;

  private getFeedPath(feedTypeId: string) {
    switch (feedTypeId) {
      case "top": return "/v0/topstories";
      case "new": return "/v0/newstories";
      case "best": return "/v0/beststories";
      default: throw new Error(`Invalid feed type: ${feedTypeId}`);
    }
  }

  async getFeed(request?: GetFeedRequest): Promise<GetFeedResponse> {
    const storiesPerPage = 20;
    const currentPage = Number(request?.pageInfo?.page ?? "1");
    const startIndex = (currentPage - 1) * storiesPerPage;
    const feedTypeId = request?.feedTypeId ?? "top";
    const path = this.getFeedPath(feedTypeId);
    const snapshot = await get(query(child(db, path), orderByKey()));
    if (snapshot.exists()) {
      const allIds: number[] = snapshot.val();
      const pageIds = allIds.slice(startIndex, startIndex + storiesPerPage);
      const stories = await Promise.all(pageIds.map(getStory));
      const items = stories.map(firebaseStoryToPost);
      items.forEach((item, index) => {
        item.number = (currentPage - 1) * storiesPerPage + index + 1;
      });
      
      return {
        items,
        pageInfo: {
          page: currentPage,
          nextPage: currentPage < Math.floor(allIds.length / storiesPerPage) ? (currentPage + 1) : undefined,
          prevPage: currentPage > 1 ? (currentPage - 1) : undefined,
        },
        feedTypeId,
        feedTypes: [
          {
            displayName: "Top",
            id: "top"
          },
          {
            displayName: "New",
            id: "new"
          },
          {
            displayName: "Best",
            id: "best"
          },
        ]
      }
    }
    return { items: [] };
  }

  async getComments(request: GetCommentsRequest): Promise<GetCommentsResponse> {
    const path = `/items/${request.apiId}`;
    const url = `${algoliaUrl}${path}`
    const response = await fetch(url);
    const json: AlgoriaStoryItem = await response.json();
    const post = algoliaStoryToPost(json);
    const items = json.children.map(algoliaCommentToPost);
    return {
      post,
      items
    }
  } 

  async getUser(request: GetUserRequest): Promise<GetUserReponse> {
    const path = `/search_by_date?tags=(comment, story),author_${request.apiId}`;
    const url = `${algoliaUrl}${path}`
    const response = await fetch(url);
    const json: AlgoriaSearch = await response.json();
    const items = json.hits.map(h => "title" in h ? algoliaStoryHitToPost(h) : algoliaCommentHitToPost(h));
    return {
      user: {
        apiId: request.apiId,
        name: request.apiId,
      },
      items
    }
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const url = new URL(`${algoliaUrl}/search`);
    url.searchParams.append("query", request.query);
    url.searchParams.append("tags", "story");
    
    if (request.pageInfo?.page) {
      url.searchParams.append("page", String(request.pageInfo.page));
    }
    
    const response = await fetch(url.toString());
    const json: AlgoriaSearch = await response.json();
    const items = json.hits
      .filter((hit): hit is AlgoriaStoryHit => "title" in hit)
      .map(hit => algoliaStoryHitToPost(hit));
    
    return {
      items,
      pageInfo: {
        page: json.page,
        nextPage: json.page < json.nbPages - 1 ? json.page + 1 : undefined,
        prevPage: json.page > 0 ? json.page - 1 : undefined
      }
    }
  }
}

export const hackerNews = new HackerNewsService();