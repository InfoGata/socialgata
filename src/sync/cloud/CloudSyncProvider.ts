/**
 * Cloud Sync Provider Interface
 *
 * This interface defines the contract for all cloud storage providers
 * (Dropbox, Google Drive, OneDrive, etc.)
 */

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface CloudSyncMetadata {
  lastModified: Date;
  size: number;
  version?: string;
}

export interface CloudSyncProvider {
  /**
   * Provider identifier (e.g., 'dropbox', 'googledrive', 'onedrive')
   */
  readonly providerId: string;

  /**
   * Provider display name (e.g., 'Dropbox', 'Google Drive', 'OneDrive')
   */
  readonly providerName: string;

  /**
   * Check if the provider is authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Authenticate with the cloud provider
   * Returns the access token or throws an error
   */
  authenticate(): Promise<string>;

  /**
   * Sign out from the cloud provider
   */
  signOut(): Promise<void>;

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

  /**
   * Get metadata about the stored document
   * @param docUrl - The automerge document URL
   * @returns Metadata or null if not found
   */
  getMetadata(docUrl: string): Promise<CloudSyncMetadata | null>;

  /**
   * Delete document from cloud storage
   * @param docUrl - The automerge document URL
   */
  delete(docUrl: string): Promise<void>;
}

/**
 * Error thrown when cloud sync operations fail
 */
export class CloudSyncError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CloudSyncError';
  }
}
