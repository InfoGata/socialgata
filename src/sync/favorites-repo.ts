import { Repo, DocHandle, AutomergeUrl } from '@automerge/automerge-repo';
import type { Instance, Post, Community } from '@/plugintypes';

/**
 * Favorites document structure
 * This is the CRDT document that Automerge will sync
 */
export type FavoritesDoc = {
  instances: { [key: string]: Instance };
  posts: { [key: string]: Post };
  comments: { [key: string]: Post };
  communities: { [key: string]: Community };
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
  const [pluginId, itemId] = key.split(':');
  return { pluginId, itemId };
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
  type: 'instances' | 'posts' | 'comments' | 'communities',
  key: string,
  data?: Instance | Post | Community
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
  type: 'instances' | 'posts' | 'comments' | 'communities',
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
  type: 'instances' | 'posts' | 'comments' | 'communities'
): Record<string, Instance | Post | Community> {
  if (!doc) return {};
  return doc[type] || {};
}