import { Repo, DocHandle, AutomergeUrl } from '@automerge/automerge-repo';
import type { Instance, Post, Community, User } from '@/plugintypes';
import type { FavoriteCommentSource } from '@/components/CommentPermalink';

/**
 * A favorited comment: the comment itself, plus where it came from. `Post` has
 * no field naming the post a comment belongs to, so the route context is
 * captured at favorite time and stored alongside it. Absent on comments
 * favorited before that was recorded.
 */
export type FavoriteComment = Post & { source?: FavoriteCommentSource };

/**
 * Favorites document structure
 * This is the CRDT document that Automerge will sync
 */
export type FavoritesDoc = {
  instances: { [key: string]: Instance };
  posts: { [key: string]: Post };
  comments: { [key: string]: FavoriteComment };
  communities: { [key: string]: Community };
  users: { [key: string]: User };
};

/**
 * Storage key for the document URL in localStorage
 * This allows us to persist which document we're using across sessions
 */
const FAVORITES_DOC_URL_KEY = 'socialgata-favorites-doc-url';

/**
 * Get or create the favorites document
 * If a document URL is stored in localStorage, load that document
 * Otherwise, create a new document and save its URL
 */
export async function getOrCreateFavoritesHandle(repo: Repo): Promise<DocHandle<FavoritesDoc>> {
  // Check if we have a stored document URL
  const storedUrl = localStorage.getItem(FAVORITES_DOC_URL_KEY);

  if (storedUrl) {
    // Load the existing document - repo.find() is async in automerge-repo 2.x
    return await repo.find<FavoritesDoc>(storedUrl as AutomergeUrl);
  } else {
    // Create a new document with initial structure
    const handle = repo.create<FavoritesDoc>();

    handle.change(doc => {
      doc.instances = {};
      doc.posts = {};
      doc.comments = {};
      doc.communities = {};
      doc.users = {};
    });

    // Save the document URL to localStorage
    localStorage.setItem(FAVORITES_DOC_URL_KEY, handle.url);

    return handle;
  }
}

/**
 * Helper to create unique key for items
 */
export const createFavoriteKey = (pluginId: string, itemId: string): string => {
  return `${pluginId}:${itemId}`;
};

/**
 * Helper to parse favorite key
 */
export const parseFavoriteKey = (key: string): { pluginId: string; itemId: string } => {
  // Only the first colon separates the two halves — api ids can contain colons.
  const separator = key.indexOf(':');
  if (separator === -1) return { pluginId: key, itemId: '' };
  return { pluginId: key.slice(0, separator), itemId: key.slice(separator + 1) };
};

/**
 * Recursively remove undefined values from an object to make it JSON-compatible
 * Automerge requires all values to be valid JSON types (no undefined)
 */
function sanitizeForAutomerge<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForAutomerge(item)) as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForAutomerge(value);
      }
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Toggle a favorite (add if not present, remove if present)
 */
export function toggleFavorite(
  handle: DocHandle<FavoritesDoc>,
  type: 'instances' | 'posts' | 'comments' | 'communities' | 'users',
  key: string,
  data?: Instance | Post | Community | User | FavoriteComment
) {
  handle.change(doc => {
    if (!doc[type]) {
      doc[type] = {};
    }

    if (doc[type][key]) {
      delete doc[type][key];
    } else if (data) {
      // Sanitize data to remove undefined values before storing in CRDT
      const sanitized = sanitizeForAutomerge(data);
      doc[type][key] = sanitized;
    }
  });
}

/**
 * Check if an item is favorited
 */
export function isFavorite(
  doc: FavoritesDoc | undefined,
  type: 'instances' | 'posts' | 'comments' | 'communities' | 'users',
  key: string
): boolean {
  if (!doc) return false;
  return !!doc[type]?.[key];
}

/**
 * Get all favorites of a specific type
 */
export function getFavorites(
  doc: FavoritesDoc | undefined,
  type: 'instances' | 'posts' | 'comments' | 'communities' | 'users'
): Record<string, Instance | Post | Community | User> {
  if (!doc) return {};
  return doc[type] || {};
}