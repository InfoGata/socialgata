# Popup-Based Authentication Changes

## Overview

The Dropbox authentication flow has been updated from a full-page redirect to a popup window approach. This provides a better user experience by keeping the user on the settings page while authenticating.

## Changes Made

### 1. Popup Handler Page

**File**: `public/dropbox-auth-popup.html`

- Standalone HTML page that handles the OAuth callback
- Receives authorization code from Dropbox
- Sends code to parent window via `postMessage` API
- Shows success/error states
- Auto-closes after successful authentication

### 2. Updated DropboxSyncProvider

**File**: `src/sync/cloud/DropboxSyncProvider.ts`

**Key Changes**:
- `authenticate()` now opens a popup window instead of redirecting
- Uses `window.open()` with centered positioning
- Implements `postMessage` listener to receive auth code from popup
- Handles popup closure detection (user cancelled)
- Returns a Promise that resolves when authentication completes

**New Flow**:
```typescript
async authenticate(): Promise<string> {
  // 1. Generate auth URL with PKCE
  // 2. Open popup window
  // 3. Listen for postMessage from popup
  // 4. Exchange code for token when received
  // 5. Return access token
}
```

### 3. Updated Redirect URI

**Changed from**: `/auth/dropbox/callback`
**Changed to**: `/dropbox-auth-popup.html`

**Updated in**:
- `DropboxSyncProvider.ts` - default redirect URI
- `.env.example` - example configuration
- `docs/CLOUD_SYNC_SETUP.md` - setup instructions
- `docs/CLOUD_SYNC_QUICK_START.md` - quick reference

### 4. Removed Route (Optional)

**File**: `src/routes/auth/dropbox/callback.tsx`

This route is no longer needed since we're using a static HTML page instead. However, it can be kept for backward compatibility if needed.

## How It Works

### User Flow

1. User clicks "Connect Dropbox" in settings
2. Popup window opens (600x700px, centered)
3. User logs in and authorizes app in Dropbox
4. Dropbox redirects to `/dropbox-auth-popup.html?code=...`
5. Popup page sends authorization code to parent window
6. Parent window exchanges code for access token
7. Popup automatically closes
8. User is now connected (still on settings page)

### Technical Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Main Window                          │
│                  (Settings Page)                        │
│                                                         │
│  1. Click "Connect Dropbox"                            │
│     ↓                                                   │
│  2. DropboxSyncProvider.authenticate()                 │
│     ↓                                                   │
│  3. window.open(authUrl, popup)                        │
│     ↓                                                   │
│  4. Setup postMessage listener ──────────┐             │
│                                          │             │
└──────────────────────────────────────────┼─────────────┘
                                          │
                                          │ postMessage
                                          │ (code)
                                          │
┌──────────────────────────────────────────┼─────────────┐
│                 Popup Window            │             │
│           (dropbox-auth-popup.html)     │             │
│                                         │             │
│  1. Receives ?code=xxx from Dropbox    │             │
│     ↓                                   │             │
│  2. window.opener.postMessage({ ───────┘             │
│       type: 'dropbox-auth-success',                   │
│       code: xxx                                       │
│     })                                                │
│     ↓                                                  │
│  3. Show success message                              │
│     ↓                                                  │
│  4. window.close() after 2 seconds                    │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

## Benefits

### User Experience
- ✅ **No navigation**: User stays on settings page
- ✅ **Visual feedback**: Loading state visible in main window
- ✅ **Familiar pattern**: Common OAuth popup flow
- ✅ **Auto-close**: Popup closes automatically on success
- ✅ **Error handling**: Clear error messages in popup

### Technical
- ✅ **Cleaner state**: No route state management needed
- ✅ **Simpler routing**: No special callback route required
- ✅ **Better security**: Origin verification via `postMessage`
- ✅ **Cross-domain safe**: Works with different domains
- ✅ **Popup blocking**: Graceful error if popups blocked

## Security Considerations

### Origin Verification
The popup verifies the origin before sending the auth code:
```javascript
if (event.origin !== window.location.origin) {
  return; // Ignore messages from other origins
}
```

### PKCE Flow
- Still uses PKCE (Proof Key for Code Exchange)
- Code verifier stored in sessionStorage
- Protects against authorization code interception

### Token Storage
- Access tokens stored in localStorage (same as before)
- Refresh tokens stored securely
- No tokens exposed in popup communication

## Migration Guide

### For Developers

If you have an existing Dropbox app configured:

1. **Update Redirect URI in Dropbox App**:
   - Go to Dropbox app settings
   - Remove old URI: `http://localhost:3000/auth/dropbox/callback`
   - Add new URI: `http://localhost:3000/dropbox-auth-popup.html`

2. **Update .env file**:
   ```env
   # Old
   VITE_DROPBOX_REDIRECT_URI=http://localhost:3000/auth/dropbox/callback

   # New
   VITE_DROPBOX_REDIRECT_URI=http://localhost:3000/dropbox-auth-popup.html
   ```

3. **Clear existing auth** (if needed):
   - Sign out from Dropbox in settings
   - Clear localStorage: `localStorage.removeItem('socialgata-dropbox-access-token')`
   - Reconnect with new flow

### For Production

Update production redirect URI:
```
https://yourdomain.com/dropbox-auth-popup.html
```

The popup file will be served from your static assets.

## Troubleshooting

### Popup Blocked
**Problem**: Browser blocks popup window

**Solution**:
- Ask user to allow popups for your site
- Error message shows: "Failed to open popup. Please allow popups for this site."

### postMessage Not Received
**Problem**: Main window doesn't receive message from popup

**Causes**:
- Origin mismatch
- Popup closed too quickly
- Parent window navigated away

**Debug**:
```javascript
// In popup (dropbox-auth-popup.html)
console.log('Sending message to:', window.location.origin);

// In main window (DropboxSyncProvider.ts)
window.addEventListener('message', (event) => {
  console.log('Received message:', event.origin, event.data);
});
```

### Popup Won't Close
**Problem**: Popup stays open after auth

**Check**:
- JavaScript enabled in browser
- No console errors in popup
- setTimeout working correctly

## Testing

### Manual Test

1. Open settings: `http://localhost:3000/settings`
2. Click "Connect Dropbox"
3. Verify popup opens centered
4. Complete Dropbox authorization
5. Verify popup shows success message
6. Verify popup closes automatically
7. Verify main window shows "Connected"

### Test Error Cases

1. **Cancel**: Close popup before authorizing
   - Should show "Authentication cancelled" error

2. **Deny**: Deny authorization in Dropbox
   - Should show error message in popup

3. **Block popup**: Block popups in browser
   - Should show "Failed to open popup" error

## File Summary

### Added
- ✅ `public/dropbox-auth-popup.html` - OAuth callback handler

### Modified
- 📝 `src/sync/cloud/DropboxSyncProvider.ts` - Popup-based auth
- 📝 `.env.example` - Updated redirect URI
- 📝 `docs/CLOUD_SYNC_SETUP.md` - Updated instructions
- 📝 `docs/CLOUD_SYNC_QUICK_START.md` - Updated quick start

### Deprecated (Optional)
- ⚠️ `src/routes/auth/dropbox/callback.tsx` - No longer needed

## Build Status

✅ **Build**: Successful
✅ **Lint**: No errors or warnings
✅ **TypeScript**: All types valid
✅ **File size**: ~4KB (dropbox-auth-popup.html)

## Next Steps

1. Test the popup flow with a real Dropbox app
2. Verify popup blocking detection works
3. Test on different browsers (Chrome, Firefox, Safari)
4. Test on mobile (may need fallback to redirect)
5. Consider adding analytics for popup success/failure rates
