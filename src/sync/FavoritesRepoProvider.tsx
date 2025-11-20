import React from 'react';
import { Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { BroadcastChannelNetworkAdapter } from '@automerge/automerge-repo-network-broadcastchannel';
import { RepoContext } from '@automerge/automerge-repo-react-hooks';

/**
 * Provider component that sets up the Automerge Repo
 * with IndexedDB storage and BroadcastChannel network for tab-to-tab sync
 */
export const FavoritesRepoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repo = React.useMemo(() => {
    return new Repo({
      // Use IndexedDB for persistent storage in the browser
      storage: new IndexedDBStorageAdapter('socialgata-favorites'),

      // Use BroadcastChannel to sync between tabs in the same browser
      network: [new BroadcastChannelNetworkAdapter()],
    });
  }, []);

  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>;
};
