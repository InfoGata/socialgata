# Cloud Sync Quick Start Guide

## For Users

### Setup (5 minutes)

1. **Create Dropbox App**
   - Go to https://www.dropbox.com/developers/apps
   - Click "Create app"
   - Choose "Scoped access" → "Full Dropbox"
   - Name it (e.g., "SocialGata Sync")

2. **Configure Permissions**
   - Go to Permissions tab
   - Enable: `files.content.write` and `files.content.read`
   - Click "Submit"

3. **Set Redirect URI**
   - In Settings tab, under OAuth 2
   - Add: `http://localhost:3000/dropbox-auth-popup.html`
   - For production: `https://yourdomain.com/dropbox-auth-popup.html`

4. **Configure App**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_DROPBOX_CLIENT_ID=your_app_key_from_settings
   VITE_DROPBOX_REDIRECT_URI=http://localhost:3000/dropbox-auth-popup.html
   ```

5. **Start App**
   ```bash
   npm run dev
   ```

6. **Connect Dropbox**
   - Open http://localhost:3000/settings
   - Click "Connect Dropbox"
   - Authorize the app
   - Done! Auto-sync is enabled by default

### Using Cloud Sync

**View Status**
- Go to Settings → Cloud Sync section
- See connection status, last sync time

**Manual Sync**
- Click "Sync Now" button in settings

**Auto-Sync**
- Enabled by default (syncs every 30 seconds)
- Toggle off if you prefer manual sync only

**Disconnect**
- Click "Disconnect" button
- Removes access token
- Local favorites remain unchanged

## For Developers

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User's Browser                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              IndexedDB (Primary Storage)              │  │
│  │                 - Fast, offline-first                 │  │
│  │                 - Automerge CRDT doc                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕ ↕ ↕                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            CloudSyncManager (Orchestrator)            │  │
│  │          - Periodic sync (every 30s)                  │  │
│  │          - Download → Merge → Upload                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              ↕                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │       DropboxSyncProvider (Implementation)            │  │
│  │          - OAuth 2.0 authentication                   │  │
│  │          - File upload/download                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    ┌─────────────────┐
                    │  Dropbox Cloud  │
                    │  /socialgata-*  │
                    │  .automerge     │
                    └─────────────────┘
```

### Key Components

**CloudSyncManager** (`src/sync/cloud/CloudSyncManager.ts`)
```typescript
// Usage
import { cloudSyncManager } from '@/sync/FavoritesContext';

// Manually trigger sync
await cloudSyncManager.syncNow();

// Get status
const status = cloudSyncManager.getStatus(); // 'idle' | 'syncing' | 'success' | 'error'
const lastSync = cloudSyncManager.getLastSyncTime();
const error = cloudSyncManager.getLastError();

// Subscribe to status changes
const unsubscribe = cloudSyncManager.onStatusChange((status) => {
  console.log('Sync status:', status);
});
```

**CloudSyncProvider Interface** (`src/sync/cloud/CloudSyncProvider.ts`)
```typescript
interface CloudSyncProvider {
  providerId: string;
  providerName: string;
  isAuthenticated(): boolean;
  authenticate(): Promise<string>;
  signOut(): Promise<void>;
  upload(docUrl: string, data: Uint8Array): Promise<void>;
  download(docUrl: string): Promise<Uint8Array | null>;
  getMetadata(docUrl: string): Promise<CloudSyncMetadata | null>;
  delete(docUrl: string): Promise<void>;
}
```

### Adding a New Provider

Example: Google Drive

1. **Create Provider**
   ```typescript
   // src/sync/cloud/GoogleDriveSyncProvider.ts
   import type { CloudSyncProvider } from './CloudSyncProvider';

   export class GoogleDriveSyncProvider implements CloudSyncProvider {
     readonly providerId = 'googledrive';
     readonly providerName = 'Google Drive';

     isAuthenticated(): boolean {
       return !!localStorage.getItem('googledrive-token');
     }

     async authenticate(): Promise<string> {
       // Implement Google OAuth flow
     }

     async upload(docUrl: string, data: Uint8Array): Promise<void> {
       // Use Google Drive API
     }

     async download(docUrl: string): Promise<Uint8Array | null> {
       // Use Google Drive API
     }

     // ... implement other methods
   }
   ```

2. **Create OAuth Callback**
   ```typescript
   // src/routes/auth/googledrive/callback.tsx
   export const Route = createFileRoute('/auth/googledrive/callback')({
     component: GoogleDriveCallback,
   });
   ```

3. **Update FavoritesContext**
   ```typescript
   // src/sync/FavoritesContext.tsx
   case 'googledrive':
     provider = new GoogleDriveSyncProvider();
     break;
   ```

4. **Update Settings UI**
   ```typescript
   // src/components/Settings/CloudSyncSettings.tsx
   <Button onClick={() => handleConnect('googledrive')}>
     Connect Google Drive
   </Button>
   ```

5. **Add Environment Variables**
   ```env
   VITE_GOOGLE_DRIVE_CLIENT_ID=...
   VITE_GOOGLE_DRIVE_REDIRECT_URI=...
   ```

### Redux State

```typescript
// Access cloud sync settings
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

const cloudSync = useSelector((state: RootState) => state.ui.cloudSync);
// cloudSync = {
//   provider: 'dropbox' | 'googledrive' | 'onedrive' | null,
//   enabled: boolean,
//   autoSync: boolean,
//   syncIntervalSeconds: number
// }

// Update settings
import { useDispatch } from 'react-redux';
import { setCloudSyncProvider, setCloudSyncEnabled } from '@/store/reducers/uiSlice';

dispatch(setCloudSyncProvider('dropbox'));
dispatch(setCloudSyncEnabled(true));
```

### Sync Flow Details

```typescript
// 1. Download remote (if exists)
const remoteData = await provider.download(docUrl);

// 2. Merge with local (CRDT handles conflicts)
if (remoteData) {
  const remoteDoc = load<FavoritesDoc>(remoteData);
  handle.change((doc) => {
    Object.assign(doc.instances, remoteDoc.instances);
    Object.assign(doc.posts, remoteDoc.posts);
    Object.assign(doc.comments, remoteDoc.comments);
    Object.assign(doc.communities, remoteDoc.communities);
  });
}

// 3. Upload merged local
const localDoc = handle.docSync();
const localData = save(localDoc);
await provider.upload(docUrl, localData);
```

### Testing

```bash
# Unit tests
npm test

# Manual testing
npm run dev

# Build
npm run build
```

### Common Issues

**Build Error: Route type not found**
- Run `npm run dev` first to generate route types
- TanStack Router generates types on dev server start

**OAuth Redirect Mismatch**
- Check redirect URI in Dropbox app settings
- Must match `VITE_DROPBOX_REDIRECT_URI` exactly

**Sync Not Working**
- Check browser console for errors
- Verify access token in localStorage
- Check Dropbox app permissions
- Try disconnecting and reconnecting

## API Reference

### CloudSyncManager Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `setProvider(provider)` | Set cloud provider | `void` |
| `setHandle(handle)` | Set automerge document handle | `void` |
| `getStatus()` | Get current sync status | `SyncStatus` |
| `getLastSyncTime()` | Get last successful sync time | `Date \| null` |
| `getLastError()` | Get last error | `CloudSyncError \| null` |
| `onStatusChange(callback)` | Subscribe to status changes | `() => void` (unsubscribe) |
| `startPeriodicSync(intervalMs)` | Start auto-sync | `void` |
| `stopPeriodicSync()` | Stop auto-sync | `void` |
| `syncNow()` | Trigger immediate sync | `Promise<void>` |
| `uploadNow()` | Force upload to cloud | `Promise<void>` |
| `downloadNow()` | Force download from cloud | `Promise<void>` |
| `dispose()` | Clean up resources | `void` |

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_DROPBOX_CLIENT_ID` | Dropbox app key | `abc123xyz` |
| `VITE_DROPBOX_REDIRECT_URI` | OAuth redirect URL | `http://localhost:3000/auth/dropbox/callback` |
| `VITE_GOOGLE_DRIVE_CLIENT_ID` | Google Drive client ID (future) | - |
| `VITE_ONEDRIVE_CLIENT_ID` | OneDrive client ID (future) | - |

## Resources

- **Setup Guide**: `docs/CLOUD_SYNC_SETUP.md`
- **Implementation Summary**: `docs/CLOUD_SYNC_IMPLEMENTATION_SUMMARY.md`
- **Dropbox API Docs**: https://www.dropbox.com/developers/documentation
- **Automerge Docs**: https://automerge.org/docs/
