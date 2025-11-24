import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Cloud, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { RootState } from '@/store/store';
import { cloudSyncManager } from '@/sync/cloudSyncManager';
import type { SyncStatus } from '@/sync/cloud/CloudSyncProvider';

/**
 * Sync Status Indicator
 * Small component that shows current cloud sync status
 * Can be placed in the header or toolbar
 */
const SyncStatusIndicator: React.FC = () => {
  const cloudSync = useSelector((state: RootState) => state.ui.cloudSync);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = cloudSyncManager.onStatusChange((status) => {
      setSyncStatus(status);
      setLastSyncTime(cloudSyncManager.getLastSyncTime());
    });

    // Initial status
    setSyncStatus(cloudSyncManager.getStatus());
    setLastSyncTime(cloudSyncManager.getLastSyncTime());

    return unsubscribe;
  }, []);

  // Don't show if sync is not enabled
  if (!cloudSync.enabled || !cloudSync.provider) {
    return null;
  }

  // Get icon and color based on status
  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    const providerName = cloudSync.provider === 'dropbox' ? 'Dropbox' : cloudSync.provider === 'googledrive' ? 'Google Drive' : 'OneDrive';

    switch (syncStatus) {
      case 'syncing':
        return `Syncing with ${providerName}...`;
      case 'success':
        return lastSyncTime
          ? `Last synced with ${providerName} at ${new Date(lastSyncTime).toLocaleTimeString()}`
          : `Synced with ${providerName}`;
      case 'error': {
        const error = cloudSyncManager.getLastError();
        return `Sync failed: ${error?.message || 'Unknown error'}`;
      }
      default:
        return `Cloud sync with ${providerName} is idle`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent"
            aria-label="Cloud sync status"
          >
            {getStatusIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
