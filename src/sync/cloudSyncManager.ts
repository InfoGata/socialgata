import { CloudSyncManager } from './cloud/CloudSyncManager';
import type { FavoritesDoc } from './favorites-repo';

/**
 * Global CloudSyncManager instance
 * Exported separately to avoid react-refresh warnings
 */
export const cloudSyncManager = new CloudSyncManager<FavoritesDoc>();
