import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Cloud, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  setCloudSyncAutoSync,
  setCloudSyncEnabled,
  setCloudSyncPluginProvider,
  disconnectCloudSync,
} from '@/store/reducers/uiSlice';
import type { RootState } from '@/store/store';
import { cloudSyncManager } from '@/sync/cloudSyncManager';
import type { SyncStatus } from '@/sync/cloud/CloudSyncProvider';
import { PluginSyncProviderAdapter } from '@/sync/cloud/PluginSyncProviderAdapter';
import { usePlugins } from '@/hooks/usePlugins';
import type { PluginFrameContainer } from '@/contexts/PluginsContext';

/**
 * Cloud Sync Settings Component
 * Allows users to connect cloud storage providers and configure sync settings
 */
const CloudSyncSettings: React.FC = () => {
  const dispatch = useDispatch();
  const cloudSync = useSelector((state: RootState) => state.ui.cloudSync);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { plugins } = usePlugins();
  const [syncCapablePlugins, setSyncCapablePlugins] = useState<PluginFrameContainer[]>([]);

  // Check which plugins have sync capabilities (onSyncUpload and onSyncDownload defined)
  useEffect(() => {
    const checkSyncCapabilities = async () => {
      const capable: PluginFrameContainer[] = [];
      for (const plugin of plugins) {
        const hasUpload = await plugin.hasDefined.onSyncUpload();
        const hasDownload = await plugin.hasDefined.onSyncDownload();
        if (hasUpload && hasDownload) {
          capable.push(plugin);
        }
      }
      setSyncCapablePlugins(capable);
    };
    checkSyncCapabilities();
  }, [plugins]);

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

  // Connect a sync-capable plugin
  const handleConnect = (plugin: PluginFrameContainer) => {
    const adapter = new PluginSyncProviderAdapter(plugin);
    cloudSyncManager.setProvider(adapter);
    dispatch(setCloudSyncPluginProvider({ pluginId: plugin.id! }));
    dispatch(setCloudSyncEnabled(true));
    if (cloudSync.autoSync) {
      cloudSyncManager.startPeriodicSync(cloudSync.syncIntervalSeconds * 1000);
    }
  };

  // Disconnect the current provider
  const handleDisconnect = () => {
    cloudSyncManager.stopPeriodicSync();
    cloudSyncManager.setProvider(null);
    dispatch(disconnectCloudSync());
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
          {syncCapablePlugins.length > 0 ? (
            <div className="grid gap-3">
              {syncCapablePlugins.map(plugin => (
                <div key={plugin.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-5 w-5" />
                    <span className="font-medium">{plugin.name}</span>
                  </div>
                  <Button size="sm" onClick={() => handleConnect(plugin)}>
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No sync providers available. Install a plugin with sync capabilities to enable cloud sync.
            </p>
          )}
        </div>
      ) : (
        // Connected - show sync settings
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <Cloud className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">
                  {plugins.find(p => p.id === cloudSync.pluginId)?.name || 'Sync Provider'}
                </p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
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
