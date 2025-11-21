import { useMemo } from 'react';
import type { Instance, Post, Community } from '@/plugintypes';
import { useFavoritesContext } from './useFavoritesContext';
import {
  createFavoriteKey,
  parseFavoriteKey,
  toggleFavorite,
  isFavorite,
  getFavorites,
} from './favorites-repo';

/**
 * Hook to check if an instance is favorited
 */
export function useIsFavoriteInstance(pluginId: string, instanceId: string): boolean {
  const { doc } = useFavoritesContext();
  const key = createFavoriteKey(pluginId, instanceId);
  return isFavorite(doc, 'instances', key);
}

/**
 * Hook to check if a post is favorited
 */
export function useIsFavoritePost(pluginId: string, postId: string): boolean {
  const { doc } = useFavoritesContext();
  const key = createFavoriteKey(pluginId, postId);
  return isFavorite(doc, 'posts', key);
}

/**
 * Hook to check if a comment is favorited
 */
export function useIsFavoriteComment(pluginId: string, commentId: string): boolean {
  const { doc } = useFavoritesContext();
  const key = createFavoriteKey(pluginId, commentId);
  return isFavorite(doc, 'comments', key);
}

/**
 * Hook to check if a community is favorited
 */
export function useIsFavoriteCommunity(pluginId: string, communityId: string): boolean {
  const { doc } = useFavoritesContext();
  const key = createFavoriteKey(pluginId, communityId);
  return isFavorite(doc, 'communities', key);
}

/**
 * Hook to get all favorite instances
 */
export function useFavoriteInstances() {
  const { doc } = useFavoritesContext();
  return useMemo(() => {
    const instances = getFavorites(doc, 'instances') as Record<string, Instance>;
    return Object.entries(instances).map(([key, instance]) => ({
      key,
      ...parseFavoriteKey(key),
      instance
    }));
  }, [doc]);
}

/**
 * Hook to get all favorite posts
 */
export function useFavoritePosts() {
  const { doc } = useFavoritesContext();
  return useMemo(() => {
    const posts = getFavorites(doc, 'posts') as Record<string, Post>;
    return Object.entries(posts).map(([key, post]) => ({
      key,
      ...parseFavoriteKey(key),
      post
    }));
  }, [doc]);
}

/**
 * Hook to get all favorite comments
 */
export function useFavoriteComments() {
  const { doc } = useFavoritesContext();
  return useMemo(() => {
    const comments = getFavorites(doc, 'comments') as Record<string, Post>;
    return Object.entries(comments).map(([key, comment]) => ({
      key,
      ...parseFavoriteKey(key),
      comment
    }));
  }, [doc]);
}

/**
 * Hook to get all favorite communities
 */
export function useFavoriteCommunities() {
  const { doc } = useFavoritesContext();
  return useMemo(() => {
    const communities = getFavorites(doc, 'communities') as Record<string, Community>;
    return Object.entries(communities).map(([key, community]) => ({
      key,
      ...parseFavoriteKey(key),
      community
    }));
  }, [doc]);
}

/**
 * Hook to get favorites mutation functions
 */
export function useFavoritesMutations() {
  const { handle } = useFavoritesContext();

  return useMemo(() => ({
    toggleInstance: (pluginId: string, instanceId: string, instance?: Instance) => {
      const key = createFavoriteKey(pluginId, instanceId);
      toggleFavorite(handle, 'instances', key, instance);
    },

    togglePost: (pluginId: string, postId: string, post?: Post) => {
      const key = createFavoriteKey(pluginId, postId);
      toggleFavorite(handle, 'posts', key, post);
    },

    toggleComment: (pluginId: string, commentId: string, comment?: Post) => {
      const key = createFavoriteKey(pluginId, commentId);
      toggleFavorite(handle, 'comments', key, comment);
    },

    toggleCommunity: (pluginId: string, communityId: string, community?: Community) => {
      const key = createFavoriteKey(pluginId, communityId);
      toggleFavorite(handle, 'communities', key, community);
    }
  }), [handle]);
}

export { createFavoriteKey, parseFavoriteKey };
