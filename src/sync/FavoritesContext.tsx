import React, { createContext, useEffect, useState } from 'react';
import { useRepo, useDocument } from '@automerge/automerge-repo-react-hooks';
import type { DocHandle } from '@automerge/automerge-repo';
import { getOrCreateFavoritesHandle, type FavoritesDoc } from './favorites-repo';
import type { FavoritesContextValue } from './useFavoritesContext';
import { cloudSyncManager } from './cloudSyncManager';
import { PluginSyncProviderAdapter } from './cloud/PluginSyncProviderAdapter';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { usePlugins } from '@/hooks/usePlugins';

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
  const { plugins, pluginsLoaded } = usePlugins();

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
    // Wait for plugins to load before setting up sync
    if (!cloudSync.enabled || !cloudSync.pluginId || !pluginsLoaded) {
      cloudSyncManager.setProvider(null);
      cloudSyncManager.stopPeriodicSync();
      return;
    }

    const plugin = plugins.find(p => p.id === cloudSync.pluginId);
    if (!plugin) {
      console.warn("Plugin sync provider not found");
      cloudSyncManager.setProvider(null);
      cloudSyncManager.stopPeriodicSync();
      return;
    }

    // Check if plugin has sync capabilities
    const setupSync = async () => {
      const hasUpload = await plugin.hasDefined.onSyncUpload();
      const hasDownload = await plugin.hasDefined.onSyncDownload();
      if (!hasUpload || !hasDownload) {
        console.warn("Plugin does not have sync capability");
        cloudSyncManager.setProvider(null);
        cloudSyncManager.stopPeriodicSync();
        return;
      }

      const adapter = new PluginSyncProviderAdapter(plugin);
      cloudSyncManager.setProvider(adapter);

      if (cloudSync.autoSync) {
        const intervalMs = cloudSync.syncIntervalSeconds * 1000;
        cloudSyncManager.startPeriodicSync(intervalMs);
      }
    };

    setupSync();

    return () => {
      if (!cloudSync.autoSync) {
        cloudSyncManager.stopPeriodicSync();
      }
    };
  }, [
    cloudSync.enabled,
    cloudSync.autoSync,
    cloudSync.syncIntervalSeconds,
    cloudSync.pluginId,
    plugins,
    pluginsLoaded,
  ]);

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
