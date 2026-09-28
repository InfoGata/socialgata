import React, { createContext, useEffect, useState } from 'react';
import { useRepo, useDocument } from '@automerge/automerge-repo-react-hooks';
import type { DocHandle } from '@automerge/automerge-repo';
import * as A from '@automerge/automerge';
import {
  copyFavorites,
  getOrCreateFavoritesHandle,
  isFavoritesDoc,
  type FavoritesDoc,
} from './favorites-repo';
import type { CloudSyncProvider } from './cloud/CloudSyncProvider';
import type { FavoritesContextValue } from './useFavoritesContext';
import { cloudSyncManager } from './cloudSyncManager';
import { PluginSyncProviderAdapter } from './cloud/PluginSyncProviderAdapter';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { usePlugins } from '@/hooks/usePlugins';

/**
 * Name of the cloud file. "-v2" because the file before it held a document
 * with its own history, which can't be merged; older versions of the app keep
 * writing that one, so they can't overwrite this.
 */
const FAVORITES_SYNC_FILE = 'socialgata-favorites-v2';
const LEGACY_SYNC_FILE = 'socialgata-favorites';

/**
 * The first sync to the new file brings in whatever the old one had. It is a
 * one-off copy, not a merge, so favorites removed since won't be removed here.
 */
async function importLegacyCloudFavorites(
  provider: CloudSyncProvider,
  handle: DocHandle<FavoritesDoc>
) {
  const bytes = await provider.download(LEGACY_SYNC_FILE);
  if (!bytes) return;
  const legacy = A.load<FavoritesDoc>(bytes);
  handle.change((doc) => copyFavorites(doc, legacy));
}

// eslint-disable-next-line react-refresh/only-export-components
export const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Provider that manages the favorites document and makes it available via hooks
 * Also sets up cloud sync based on Redux settings
 */
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repo = useRepo();
  const [handle, setHandle] = useState<DocHandle<FavoritesDoc> | null>(null);
  const [doc] = useDocument<FavoritesDoc>(handle?.url);
  const isReady = !!(doc && handle);
  const cloudSync = useSelector((state: RootState) => state.ui.cloudSync);
  const { plugins, pluginsLoaded } = usePlugins();

  // Initialize favorites handle
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

  // Keep the document synced with the plugin chosen in Settings. The cleanup
  // always stops syncing, so turning auto sync off or switching plugins takes
  // effect straight away.
  const plugin = plugins.find(p => p.id === cloudSync.pluginId);
  useEffect(() => {
    if (!handle || !cloudSync.enabled || !pluginsLoaded || !plugin) {
      cloudSyncManager.configure(null);
      return;
    }

    let cancelled = false;
    const setupSync = async () => {
      const canSync =
        (await plugin.hasDefined.onSyncUpload()) &&
        (await plugin.hasDefined.onSyncDownload());
      if (cancelled) return;
      if (!canSync) {
        console.warn("Plugin does not have sync capability");
        cloudSyncManager.configure(null);
        return;
      }
      cloudSyncManager.configure({
        provider: new PluginSyncProviderAdapter(plugin),
        repo,
        handle,
        docUrl: FAVORITES_SYNC_FILE,
        isValidRemote: isFavoritesDoc,
        onNoRemote: (provider) => importLegacyCloudFavorites(provider, handle),
        autoSync: cloudSync.autoSync,
        intervalMs: cloudSync.syncIntervalSeconds * 1000,
        lockName: 'socialgata-cloud-sync',
      });
    };

    setupSync();

    return () => {
      cancelled = true;
      cloudSyncManager.configure(null);
    };
  }, [
    repo,
    handle,
    plugin,
    pluginsLoaded,
    cloudSync.enabled,
    cloudSync.autoSync,
    cloudSync.syncIntervalSeconds,
  ]);

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
