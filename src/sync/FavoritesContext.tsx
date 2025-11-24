import React, { createContext, useEffect, useState } from 'react';
import { useRepo, useDocument } from '@automerge/automerge-repo-react-hooks';
import type { DocHandle } from '@automerge/automerge-repo';
import { getOrCreateFavoritesHandle, type FavoritesDoc } from './favorites-repo';
import type { FavoritesContextValue } from './useFavoritesContext';
import { cloudSyncManager } from './cloudSyncManager';
import { DropboxSyncProvider } from './cloud/DropboxSyncProvider';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Provider that manages the favorites document and makes it available via hooks
 * Also sets up cloud sync based on Redux settings
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repo = useRepo();
  const [handle, setHandle] = useState<DocHandle<FavoritesDoc> | null>(null);
  const [doc] = useDocument<FavoritesDoc>(handle?.url);
  const [isReady, setIsReady] = useState(false);
  const cloudSync = useSelector((state: RootState) => state.ui.cloudSync);

  // Initialize favorites handle
  useEffect(() => {
    let mounted = true;

    getOrCreateFavoritesHandle(repo).then(h => {
      if (mounted) {
        setHandle(h);
        // Set handle in cloud sync manager
        cloudSyncManager.setHandle(h);
      }
    });

    return () => {
      mounted = false;
    };
  }, [repo]);

  // Set up cloud sync provider based on settings
  useEffect(() => {
    if (!cloudSync.enabled || !cloudSync.provider) {
      cloudSyncManager.setProvider(null);
      cloudSyncManager.stopPeriodicSync();
      return;
    }

    // Create provider based on selected type
    let provider = null;
    switch (cloudSync.provider) {
      case 'dropbox':
        provider = new DropboxSyncProvider();
        break;
      // Future providers will be added here
      // case 'googledrive':
      //   provider = new GoogleDriveSyncProvider();
      //   break;
      default:
        console.warn('Unknown cloud provider:', cloudSync.provider);
    }

    if (provider) {
      cloudSyncManager.setProvider(provider);

      if (cloudSync.autoSync) {
        const intervalMs = cloudSync.syncIntervalSeconds * 1000;
        cloudSyncManager.startPeriodicSync(intervalMs);
      }
    }

    return () => {
      if (!cloudSync.autoSync) {
        cloudSyncManager.stopPeriodicSync();
      }
    };
  }, [cloudSync.enabled, cloudSync.provider, cloudSync.autoSync, cloudSync.syncIntervalSeconds]);

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
