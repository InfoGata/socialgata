import { DocHandle } from '@automerge/automerge-repo';
import { load, save } from '@automerge/automerge';
import type { CloudSyncProvider, SyncStatus, CloudSyncError } from './CloudSyncProvider';
import type { FavoritesDoc } from '../favorites-repo';

/**
 * Cloud Sync Manager
 *
 * Orchestrates syncing of automerge documents with cloud storage providers.
 * Handles periodic uploads, conflict resolution via CRDT merge, and error handling.
 */
export class CloudSyncManager {
  private provider: CloudSyncProvider | null = null;
  private syncInterval: number = 30000; // 30 seconds
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private lastError: CloudSyncError | null = null;
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private handle: DocHandle<FavoritesDoc> | null = null;

  /**
   * Set the cloud provider to use for syncing
   */
  setProvider(provider: CloudSyncProvider | null) {
    this.provider = provider;
    if (!provider) {
      this.stopPeriodicSync();
    }
  }

  /**
   * Set the document handle to sync
   */
  setHandle(handle: DocHandle<FavoritesDoc> | null) {
    this.handle = handle;
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    if (this.lastError) return 'error';
    if (this.isSyncing) return 'syncing';
    if (this.lastSyncTime) return 'success';
    return 'idle';
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Get last error
   */
  getLastError(): CloudSyncError | null {
    return this.lastError;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Notify status listeners
   */
  private notifyStatusChange() {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => listener(status));
  }

  /**
   * Start periodic sync
   * @param intervalMs - Sync interval in milliseconds (default: 30s)
   */
  startPeriodicSync(intervalMs: number = this.syncInterval) {
    this.syncInterval = intervalMs;
    this.stopPeriodicSync();

    // Initial sync
    this.syncNow();

    // Set up periodic sync
    this.syncTimer = setInterval(() => {
      this.syncNow();
    }, this.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Manually trigger a sync now
   */
  async syncNow(): Promise<void> {
    if (!this.provider || !this.handle) {
      console.warn('CloudSyncManager: Cannot sync - provider or handle not set');
      return;
    }

    if (!this.provider.isAuthenticated()) {
      console.warn('CloudSyncManager: Provider not authenticated');
      return;
    }

    if (this.isSyncing) {
      console.log('CloudSyncManager: Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    this.lastError = null;
    this.notifyStatusChange();

    try {
      await this.performSync();
      this.lastSyncTime = new Date();
      this.lastError = null;
    } catch (error) {
      this.lastError = error as CloudSyncError;
      console.error('CloudSyncManager: Sync failed', error);
    } finally {
      this.isSyncing = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync() {
    if (!this.provider || !this.handle) return;

    const docUrl = this.handle.url;

    // Step 1: Download remote document if it exists
    const remoteData = await this.provider.download(docUrl);

    if (remoteData) {
      // Step 2: Merge remote document with local
      try {
        const remoteDoc = load<FavoritesDoc>(remoteData);
        // Automerge handles CRDT merge automatically
        this.handle.change((doc) => {
          // Merge each collection
          Object.assign(doc.instances, remoteDoc.instances);
          Object.assign(doc.posts, remoteDoc.posts);
          Object.assign(doc.comments, remoteDoc.comments);
          Object.assign(doc.communities, remoteDoc.communities);
        });
        console.log('CloudSyncManager: Merged remote changes');
      } catch (error) {
        console.error('CloudSyncManager: Failed to merge remote document', error);
        // Continue with upload even if merge fails
      }
    }

    // Step 3: Upload current local state
    const localDoc = this.handle.docSync();
    if (localDoc) {
      const localData = save(localDoc);
      await this.provider.upload(docUrl, localData);
      console.log('CloudSyncManager: Uploaded local document');
    }
  }

  /**
   * Force upload local document to cloud
   */
  async uploadNow(): Promise<void> {
    if (!this.provider || !this.handle) {
      throw new Error('Provider or handle not set');
    }

    if (!this.provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    const docUrl = this.handle.url;
    const localDoc = this.handle.docSync();

    if (localDoc) {
      const localData = save(localDoc);
      await this.provider.upload(docUrl, localData);
      this.lastSyncTime = new Date();
    }
  }

  /**
   * Force download remote document from cloud
   */
  async downloadNow(): Promise<void> {
    if (!this.provider || !this.handle) {
      throw new Error('Provider or handle not set');
    }

    if (!this.provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    const docUrl = this.handle.url;
    const remoteData = await this.provider.download(docUrl);

    if (remoteData) {
      const remoteDoc = load<FavoritesDoc>(remoteData);
      this.handle.change((doc) => {
        Object.assign(doc.instances, remoteDoc.instances);
        Object.assign(doc.posts, remoteDoc.posts);
        Object.assign(doc.comments, remoteDoc.comments);
        Object.assign(doc.communities, remoteDoc.communities);
      });
      this.lastSyncTime = new Date();
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopPeriodicSync();
    this.statusListeners.clear();
    this.provider = null;
    this.handle = null;
  }
}
