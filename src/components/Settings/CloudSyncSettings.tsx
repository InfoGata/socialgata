import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  setCloudSyncProvider,
  setCloudSyncEnabled,
  setCloudSyncAutoSync,
  disconnectCloudSync,
  type CloudProvider,
} from '@/store/reducers/uiSlice';
import type { RootState } from '@/store/store';
import { cloudSyncManager } from '@/sync/cloudSyncManager';
import { DropboxSyncProvider } from '@/sync/cloud/DropboxSyncProvider';
import type { SyncStatus } from '@/sync/cloud/CloudSyncProvider';

/**
 * Cloud Sync Settings Component
 * Allows users to connect cloud storage providers and configure sync settings
 */
const CloudSyncSettings: React.FC = () => {
  const dispatch = useDispatch();
  const cloudSync = useSelector((state: RootState) => state.ui.cloudSync);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Handle connecting to a cloud provider
  const handleConnect = async (provider: CloudProvider) => {
    if (!provider) return;

    setIsConnecting(true);
    try {
      let syncProvider;
      switch (provider) {
        case 'dropbox':
          syncProvider = new DropboxSyncProvider();
          await syncProvider.authenticate();
          break;
        // Future providers
        // case 'googledrive':
        //   syncProvider = new GoogleDriveSyncProvider();
        //   await syncProvider.authenticate();
        //   break;
        default:
          console.error('Unknown provider:', provider);
          return;
      }

      dispatch(setCloudSyncProvider(provider));
      dispatch(setCloudSyncEnabled(true));
    } catch (error) {
      console.error('Failed to connect to cloud provider:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle disconnecting from cloud provider
  const handleDisconnect = async () => {
    if (!cloudSync.provider) return;

    try {
      let syncProvider;
      switch (cloudSync.provider) {
        case 'dropbox':
          syncProvider = new DropboxSyncProvider();
          await syncProvider.signOut();
          break;
        // Future providers
        default:
          break;
      }

      dispatch(disconnectCloudSync());
    } catch (error) {
      console.error('Failed to disconnect from cloud provider:', error);
    }
  };

  // Handle manual sync
  const handleManualSync = async () => {
    await cloudSyncManager.syncNow();
  };

  // Toggle auto sync
  const handleToggleAutoSync = () => {
    dispatch(setCloudSyncAutoSync(!cloudSync.autoSync));
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <span className="flex items-center gap-2 text-blue-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Syncing...
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-2 text-green-500">
            <Check className="h-4 w-4" />
            Synced {lastSyncTime && `• ${new Date(lastSyncTime).toLocaleTimeString()}`}
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            Sync failed
          </span>
        );
      default:
        return <span className="text-muted-foreground">Not syncing</span>;
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Cloud className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Cloud Sync</h2>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Sync your favorites across devices using cloud storage.
      </p>

      {!cloudSync.enabled ? (
        // Not connected - show provider options
        <div className="space-y-4">
          <div className="grid gap-3">
            <Button
              onClick={() => handleConnect('dropbox')}
              disabled={isConnecting}
              className="justify-start"
              variant="outline"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822L6 18.371z"/>
              </svg>
              Connect Dropbox
            </Button>

            {/* <Button
              disabled
              className="justify-start"
              variant="outline"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.09 13.119c-.936 1.932-2.217 3.588-3.654 4.72-.95.75-1.953 1.161-2.937 1.161-.984 0-1.987-.411-2.937-1.161-1.437-1.132-2.718-2.788-3.654-4.72-.901-1.857-1.408-3.805-1.408-5.619 0-1.814.507-3.762 1.408-5.619C-1.021 2.949.26 1.293 1.697.161 2.647-.589 3.65-1 4.634-1c.984 0 1.987.411 2.937 1.161 1.437 1.132 2.718 2.788 3.654 4.72.901 1.857 1.408 3.805 1.408 5.619 0 1.814-.507 3.762-1.408 5.619zm11.46-6.119c0 1.814-.507 3.762-1.408 5.619-.936 1.932-2.217 3.588-3.654 4.72-.95.75-1.953 1.161-2.937 1.161-.984 0-1.987-.411-2.937-1.161-1.437-1.132-2.718-2.788-3.654-4.72-.901-1.857-1.408-3.805-1.408-5.619 0-1.814.507-3.762 1.408-5.619.936-1.932 2.217-3.588 3.654-4.72.95-.75 1.953-1.161 2.937-1.161.984 0 1.987.411 2.937 1.161 1.437 1.132 2.718 2.788 3.654 4.72.901 1.857 1.408 3.805 1.408 5.619z"/>
              </svg>
              Google Drive (Coming Soon)
            </Button>

            <Button
              disabled
              className="justify-start"
              variant="outline"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 1.5v6h6l-6-6zM3 0h9l9 9v12a3 3 0 01-3 3H6a3 3 0 01-3-3V3a3 3 0 013-3H3z"/>
              </svg>
              OneDrive (Coming Soon)
            </Button> */}
          </div>
        </div>
      ) : (
        // Connected - show sync settings
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Cloud className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">
                  {cloudSync.provider === 'dropbox' && 'Dropbox'}
                  {cloudSync.provider === 'googledrive' && 'Google Drive'}
                  {cloudSync.provider === 'onedrive' && 'OneDrive'}
                </p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <CloudOff className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Sync</p>
                <p className="text-sm text-muted-foreground">
                  Automatically sync changes every {cloudSync.syncIntervalSeconds} seconds
                </p>
              </div>
              <Button
                variant={cloudSync.autoSync ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleAutoSync}
              >
                {cloudSync.autoSync ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Sync Status</p>
                <div className="mt-1">{getStatusDisplay()}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </div>

            {cloudSyncManager.getLastError() && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                <p className="font-medium">Sync Error</p>
                <p className="mt-1">{cloudSyncManager.getLastError()?.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudSyncSettings;
