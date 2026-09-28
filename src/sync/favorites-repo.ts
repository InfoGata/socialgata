import * as A from '@automerge/automerge';
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
 * Every device starts its favorites from these exact bytes rather than from
 * `repo.create()`. Two documents that never shared a first change each create
 * their own `posts`, `users`, ... maps, and merging them keeps only one of
 * each -- the other device's favorites silently disappear. Starting from a
 * shared first change makes those maps the same objects everywhere, so merges
 * only ever combine what is inside them.
 *
 * Generated once with a fixed actor and `time: 0`:
 *   A.change(A.init({ actor: '0'.repeat(32) }), { time: 0, message: 'genesis' },
 *     (d) => { d.instances = {}; d.posts = {}; d.comments = {}; d.communities = {}; d.users = {} })
 * Never regenerate it: a different genesis can't merge with favorites that
 * already exist in the cloud.
 */
const GENESIS_BASE64 =
  'hW9KgydJQfgAowEBEAAAAAAAAAAAAAAAAAAAAAABQEoHjkGAlqlZD2lhgJ8voDwKeZEA1YdFOHXWVbfA7/0HAQIDAhMCIwI1CUACVgIHFSwhAiMGNAFCAlYCgAECfwB/AX8FfwB/B2dlbmVzaXN/AH8Hewhjb21tZW50cwtjb21tdW5pdGllcwlpbnN0YW5jZXMFcG9zdHMFdXNlcnMFAHsDAX0BAwUFAAUABQAA';

export const GENESIS_HEADS = [
  '404a078e418096a9590f6961809f2fa03c0a799100d587453875d655b7c0effd',
];

export const genesisBytes = (): Uint8Array =>
  Uint8Array.from(atob(GENESIS_BASE64), (c) => c.charCodeAt(0));

/** Whether a document descends from the shared genesis, and so can be merged. */
export const isFavoritesDoc = (doc: A.Doc<unknown>): boolean =>
  A.hasHeads(doc, GENESIS_HEADS);

const FAVORITE_TYPES = ['instances', 'posts', 'comments', 'communities', 'users'] as const;

/**
 * Copy every favorite in `from` that `doc` doesn't have. Only for bringing in
 * favorites from a document with its own history (from before the shared
 * genesis) -- documents that share it are merged instead.
 */
export function copyFavorites(doc: FavoritesDoc, from: Partial<FavoritesDoc>) {
  for (const type of FAVORITE_TYPES) {
    for (const [key, value] of Object.entries(from[type] ?? {})) {
      if (!doc[type][key]) {
        doc[type][key] = sanitizeForAutomerge(JSON.parse(JSON.stringify(value)));
      }
    }
  }
}

/**
 * Get or create the favorites document.
 *
 * Favorites saved before the shared genesis existed live in a document with
 * its own history, which can't be merged with other devices'. They are copied
 * into a new genesis-based document once, and that becomes the document.
 */
export async function getOrCreateFavoritesHandle(repo: Repo): Promise<DocHandle<FavoritesDoc>> {
  const storedUrl = localStorage.getItem(FAVORITES_DOC_URL_KEY);
  let legacy: FavoritesDoc | undefined;

  if (storedUrl) {
    try {
      // repo.find() is async in automerge-repo 2.x
      const handle = await repo.find<FavoritesDoc>(storedUrl as AutomergeUrl);
      const doc = handle.doc();
      if (isFavoritesDoc(doc)) return handle;
      legacy = doc;
    } catch (e) {
      console.error("Couldn't open the favorites document, starting a new one", e);
    }
  }

  const handle = repo.import<FavoritesDoc>(genesisBytes());
  if (legacy) {
    const from = legacy;
    handle.change((doc) => copyFavorites(doc, from));
  }
  localStorage.setItem(FAVORITES_DOC_URL_KEY, handle.url);
  return handle;
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
export function sanitizeForAutomerge<T>(obj: T): T {
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