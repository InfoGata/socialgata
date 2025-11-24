# Cloud Sync Setup Guide

This guide explains how to set up cloud sync for the SocialGata favorites system.

## Overview

The cloud sync feature allows users to synchronize their favorites across multiple devices using cloud storage providers like Dropbox, Google Drive, and OneDrive.

## Architecture

The sync system uses a **hybrid approach** (Option C):
- **Primary storage**: IndexedDB (fast, offline-first)
- **Cloud backup**: Periodic uploads to cloud storage
- **Conflict resolution**: Automerge CRDT automatically merges changes

### Key Components

```
src/sync/
├── cloud/
│   ├── CloudSyncProvider.ts        # Interface for all cloud providers
│   ├── CloudSyncManager.ts         # Orchestrates sync operations
│   ├── DropboxSyncProvider.ts      # Dropbox implementation
│   └── [Future: GoogleDrive, OneDrive providers]
├── FavoritesContext.tsx            # Integrates sync manager
└── FavoritesRepoProvider.tsx       # Sets up automerge-repo
```

## Setting Up Dropbox Sync

### 1. Create a Dropbox App

1. Go to https://www.dropbox.com/developers/apps
2. Click **"Create app"**
3. Choose **"Scoped access"**
4. Choose **"Full Dropbox"** access type
5. Name your app (e.g., "SocialGata Sync")
6. Click **"Create app"**

### 2. Configure App Permissions

In your app's settings:

1. Go to the **"Permissions"** tab
2. Enable these scopes:
   - `files.content.write` - Write files
   - `files.content.read` - Read files
3. Click **"Submit"** to save changes

### 3. Set Redirect URIs

In the **"Settings"** tab, under **OAuth 2**:

1. Add redirect URI for development:
   ```
   http://localhost:3000/dropbox-auth-popup.html
   ```

2. Add redirect URI for production:
   ```
   https://yourdomain.com/dropbox-auth-popup.html
   ```

### 4. Get Your App Key

1. In the **"Settings"** tab, find **"App key"**
2. Copy the App key value

### 5. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Dropbox App key:
   ```env
   VITE_DROPBOX_CLIENT_ID=your_app_key_here
   VITE_DROPBOX_REDIRECT_URI=http://localhost:3000/dropbox-auth-popup.html
   ```

3. For production, update the redirect URI to your production domain

### 6. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to Settings page (`/settings`)

3. Click **"Connect Dropbox"**

4. A popup window will open for Dropbox authorization

5. Authorize the app in Dropbox

6. The popup will close automatically and you'll be connected

## How It Works

### Sync Process

1. **Initial Setup**:
   - User clicks "Connect Dropbox" in settings
   - Popup window opens for OAuth authorization
   - User authorizes the app in Dropbox
   - Popup sends authorization code back to main window
   - Access token is exchanged and stored in localStorage
   - CloudSyncManager is initialized with DropboxSyncProvider

2. **Automatic Sync** (if enabled):
   - Every 30 seconds (configurable), the manager:
     - Downloads remote document from Dropbox
     - Merges remote changes with local using Automerge CRDT
     - Uploads updated local document to Dropbox

3. **Manual Sync**:
   - User can click "Sync Now" button in settings
   - Immediately triggers sync process

4. **Conflict Resolution**:
   - Automerge CRDT automatically merges concurrent changes
   - No manual conflict resolution needed
   - Works offline - syncs when connection is restored

### File Storage

Documents are stored in Dropbox at:
```
/socialgata-favorites-{documentId}.automerge
```

Example:
```
/socialgata-favorites-abc123xyz.automerge
```

## User Experience

### Settings UI

Users can:
- Connect/disconnect cloud providers
- Toggle auto-sync on/off
- Manually trigger sync
- View sync status (syncing, synced, error)
- See last sync time

### Sync Status Indicator

Optional component (`SyncStatusIndicator`) can be added to the header/toolbar:
- Shows current sync status icon
- Tooltip displays last sync time or error
- Only visible when sync is enabled

## Adding New Cloud Providers

To add Google Drive or OneDrive support:

### 1. Create Provider Implementation

```typescript
// src/sync/cloud/GoogleDriveSyncProvider.ts
export class GoogleDriveSyncProvider implements CloudSyncProvider {
  readonly providerId = 'googledrive';
  readonly providerName = 'Google Drive';

  // Implement all methods from CloudSyncProvider interface
  async authenticate() { ... }
  async upload(docUrl, data) { ... }
  async download(docUrl) { ... }
  // ... etc
}
```

### 2. Add OAuth Callback Route

```tsx
// src/routes/auth/googledrive/callback.tsx
export const Route = createFileRoute('/auth/googledrive/callback')({
  component: GoogleDriveCallback,
});
```

### 3. Update FavoritesContext

```typescript
// In src/sync/FavoritesContext.tsx
case 'googledrive':
  provider = new GoogleDriveSyncProvider();
  break;
```

### 4. Update Settings UI

```tsx
// In src/components/Settings/CloudSyncSettings.tsx
<Button onClick={() => handleConnect('googledrive')}>
  Connect Google Drive
</Button>
```

### 5. Add Environment Variables

```env
VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id
VITE_GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/googledrive/callback
```

## Troubleshooting

### "Not authenticated" error

- Check that environment variables are set correctly
- Ensure Dropbox app is configured with correct redirect URI
- Try disconnecting and reconnecting

### Sync fails repeatedly

- Check browser console for detailed error messages
- Verify Dropbox app has correct permissions
- Check network connectivity
- Try manual sync to see specific error

### Token expired

- Tokens are refreshed automatically if refresh token is available
- If refresh fails, user needs to reconnect

### Conflicts not resolving

- Automerge should handle all conflicts automatically
- If seeing duplicates or lost data, check console for merge errors
- File an issue with reproduction steps

## Security Considerations

### Access Tokens

- Stored in localStorage (encrypted by browser)
- Never sent to backend servers
- Only used for direct Dropbox API calls
- Cleared on disconnect

### Data Privacy

- Documents stored in user's own Dropbox account
- No data passes through SocialGata servers
- Users have full control over their data

### Permissions

- App only requests minimal necessary permissions
- Files stored in app-specific folder
- Cannot access other Dropbox files

## Performance

### Bandwidth

- Full document uploaded on each sync (~KB for typical favorites)
- For large favorites lists, consider:
  - Increasing sync interval
  - Disabling auto-sync
  - Using manual sync only

### Storage

- One file per automerge document in Dropbox
- Old versions managed by Dropbox's version history
- No cleanup needed

## Future Enhancements

Potential improvements:

1. **Delta sync**: Only upload changes (requires NetworkAdapter approach)
2. **Compression**: Compress documents before upload
3. **Selective sync**: Choose what to sync (instances, posts, etc.)
4. **Conflict UI**: Show conflicts when CRDT can't auto-resolve
5. **Sync history**: Show timeline of syncs and changes
6. **Multiple accounts**: Sync different collections to different accounts
