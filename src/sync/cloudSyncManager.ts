import { CloudSyncManager } from './cloud/CloudSyncManager';

/**
 * Global CloudSyncManager instance
 * Exported separately to avoid react-refresh warnings
 */
export const cloudSyncManager = new CloudSyncManager();
