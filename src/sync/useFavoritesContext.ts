import { useContext } from 'react';
import type { DocHandle } from '@automerge/automerge-repo';
import type { FavoritesDoc } from './favorites-repo';
import { FavoritesContext } from './FavoritesContext';

export interface FavoritesContextValue {
  handle: DocHandle<FavoritesDoc>;
  doc: FavoritesDoc | undefined;
  isReady: boolean;
}

/**
 * Hook to access the favorites context
 */
export function useFavoritesContext(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within FavoritesProvider');
  }
  return context;
}
