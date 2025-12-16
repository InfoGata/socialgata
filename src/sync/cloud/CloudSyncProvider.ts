/**
 * Cloud Sync Provider Interface
 *
 * This interface defines the contract for all cloud storage providers
 * (Dropbox, Google Drive, OneDrive, etc.)
 */

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface CloudSyncProvider {
  /**
   * Upload document data to cloud storage
   * @param docUrl - The automerge document URL
   * @param data - The binary automerge document data
   */
  upload(docUrl: string, data: Uint8Array): Promise<void>;

  /**
   * Download document data from cloud storage
   * @param docUrl - The automerge document URL
   * @returns The binary document data, or null if not found
   */
  download(docUrl: string): Promise<Uint8Array | null>;
}

/**
 * Error thrown when cloud sync operations fail
 */
export class CloudSyncError extends Error {
  constructor(
    message: string,
    public readonly pluginId: string
  ) {
    super(message);
    this.name = 'CloudSyncError';
  }
}
