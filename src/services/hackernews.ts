import { GetCommentsRequest, GetCommentsResponse, GetHomeResponse, GetUserReponse, Post } from "@/plugintypes";
import { ServiceType } from "@/types";
import { initializeApp } from "firebase/app"
import { getDatabase, ref, child, get, query, orderByKey, limitToFirst } from "firebase/database"

const pluginName = "hackernews";
const hackerNewsUrl = "https://news.ycombinator.com"
const algoliaUrl = "http://hn.algolia.com/api/v1";
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
  async getFeed(): Promise<GetHomeResponse> {
    const snapshot = await get(query(child(db, "v0/topstories"), limitToFirst(50), orderByKey()));
    if (snapshot.exists()) {
      const ids: number[] = snapshot.val();
      const stories = await Promise.all(ids.map(getStory));
      const items = stories.map(firebaseStoryToPost);
      return {
        items
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

  async getUser(apiId: string): Promise<GetUserReponse> {
    const path = `/search_by_date?tags=(comment, story),author_${apiId}`;
    const url = `${algoliaUrl}${path}`
    const response = await fetch(url);
    const json: AlgoriaSearch = await response.json();
    const items = json.hits.map(h => "title" in h ? algoliaStoryHitToPost(h) : algoliaCommentHitToPost(h));
    return {
      items
    }
  }
}

export const hackerNews = new HackerNewsService();