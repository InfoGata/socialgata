import React, { createContext, useEffect, useState } from 'react';
import { useRepo, useDocument } from '@automerge/automerge-repo-react-hooks';
import type { DocHandle } from '@automerge/automerge-repo';
import { getOrCreateFavoritesHandle, type FavoritesDoc } from './favorites-repo';
import type { FavoritesContextValue } from './useFavoritesContext';

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Provider that manages the favorites document and makes it available via hooks
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repo = useRepo();
  const [handle, setHandle] = useState<DocHandle<FavoritesDoc> | null>(null);
  const [doc] = useDocument<FavoritesDoc>(handle?.url);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    getOrCreateFavoritesHandle(repo).then(h => {
      if (mounted) {
        setHandle(h);
      }
    });

    return () => {
      mounted = false;
    };
  }, [repo]);

  useEffect(() => {
    if (doc && handle) {
      setIsReady(true);
    }
  }, [doc, handle]);

  // Don't provide context until handle is ready
  if (!handle) {
    return null;
  }

  return (
    <FavoritesContext.Provider value={{ handle, doc, isReady }}>
      {children}
    </FavoritesContext.Provider>
  );
};
