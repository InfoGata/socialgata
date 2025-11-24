import { Dropbox, DropboxAuth } from 'dropbox';
import type {
  CloudSyncProvider,
  CloudSyncMetadata,
  CloudSyncError,
} from './CloudSyncProvider';

/**
 * Dropbox OAuth configuration
 * These should be set via environment variables or config
 */
const DROPBOX_CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || '';
const DROPBOX_REDIRECT_URI = import.meta.env.VITE_DROPBOX_REDIRECT_URI || `${window.location.origin}/dropbox-auth-popup.html`;

/**
 * Local storage keys
 */
const DROPBOX_ACCESS_TOKEN_KEY = 'socialgata-dropbox-access-token';
const DROPBOX_REFRESH_TOKEN_KEY = 'socialgata-dropbox-refresh-token';

/**
 * Dropbox Sync Provider
 *
 * Implements cloud sync using Dropbox API.
 * Stores automerge documents in /Apps/SocialGata/ folder.
 */
export class DropboxSyncProvider implements CloudSyncProvider {
  readonly providerId = 'dropbox';
  readonly providerName = 'Dropbox';

  private dbx: Dropbox | null = null;
  private dbxAuth: DropboxAuth;
  private accessToken: string | null = null;

  constructor() {
    // Initialize Dropbox Auth
    this.dbxAuth = new DropboxAuth({
      clientId: DROPBOX_CLIENT_ID,
    });

    // Try to load existing access token
    this.accessToken = localStorage.getItem(DROPBOX_ACCESS_TOKEN_KEY);

    if (this.accessToken) {
      this.initializeClient(this.accessToken);
    }
  }

  /**
   * Initialize Dropbox client with access token
   */
  private initializeClient(accessToken: string) {
    this.accessToken = accessToken;
    this.dbxAuth.setAccessToken(accessToken);
    this.dbx = new Dropbox({
      auth: this.dbxAuth,
    });
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null && this.dbx !== null;
  }

  /**
   * Start OAuth authentication flow
   * This should be called when the user clicks "Connect Dropbox"
   * Opens a popup window for authentication
   */
  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Set redirect URI
        this.dbxAuth.setClientId(DROPBOX_CLIENT_ID);

        // Generate auth URL with PKCE
        this.dbxAuth.getAuthenticationUrl(
          DROPBOX_REDIRECT_URI,
          undefined,
          'code',
          'offline', // Request offline access for refresh token
          undefined,
          undefined,
          true // Use PKCE
        ).then((authUrl) => {
          // Store code verifier for later
          const codeVerifier = this.dbxAuth.getCodeVerifier();
          sessionStorage.setItem('dropbox-code-verifier', codeVerifier);

          // Open popup window
          const width = 600;
          const height = 700;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          const popup = window.open(
            authUrl.toString(),
            'dropbox-auth',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
          );

          if (!popup) {
            reject(this.createError('Failed to open popup. Please allow popups for this site.'));
            return;
          }

          // Listen for message from popup
          const messageListener = async (event: MessageEvent) => {
            // Verify origin
            if (event.origin !== window.location.origin) {
              return;
            }

            // Check if this is the auth success message
            if (event.data?.type === 'dropbox-auth-success' && event.data?.code) {
              // Clean up listener
              window.removeEventListener('message', messageListener);

              try {
                // Exchange code for token
                const accessToken = await this.handleOAuthCallback(event.data.code);
                resolve(accessToken);
              } catch (error) {
                reject(error);
              }
            }
          };

          window.addEventListener('message', messageListener);

          // Check if popup was closed without completing auth
          const popupCheckInterval = setInterval(() => {
            if (popup.closed) {
              clearInterval(popupCheckInterval);
              window.removeEventListener('message', messageListener);

              // Only reject if we haven't already resolved
              const verifier = sessionStorage.getItem('dropbox-code-verifier');
              if (verifier) {
                sessionStorage.removeItem('dropbox-code-verifier');
                reject(this.createError('Authentication cancelled'));
              }
            }
          }, 500);
        }).catch((error) => {
          reject(this.createError('Failed to generate auth URL', error));
        });
      } catch (error) {
        reject(this.createError('Authentication failed', error));
      }
    });
  }

  /**
   * Handle OAuth callback
   * This should be called from the OAuth redirect page
   */
  async handleOAuthCallback(code: string): Promise<string> {
    try {
      const codeVerifier = sessionStorage.getItem('dropbox-code-verifier') || '';

      this.dbxAuth.setCodeVerifier(codeVerifier);

      // Exchange code for access token
      const response = await this.dbxAuth.getAccessTokenFromCode(
        DROPBOX_REDIRECT_URI,
        code
      );

      const result = response.result as { access_token: string; refresh_token?: string };
      const accessToken = result.access_token;
      const refreshToken = result.refresh_token;

      // Store tokens
      localStorage.setItem(DROPBOX_ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(DROPBOX_REFRESH_TOKEN_KEY, refreshToken);
      }

      // Initialize client
      this.initializeClient(accessToken);

      // Clean up
      sessionStorage.removeItem('dropbox-code-verifier');

      return accessToken;
    } catch (error) {
      throw this.createError('Failed to exchange authorization code', error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    this.accessToken = null;
    this.dbx = null;
    localStorage.removeItem(DROPBOX_ACCESS_TOKEN_KEY);
    localStorage.removeItem(DROPBOX_REFRESH_TOKEN_KEY);
  }

  /**
   * Get file path for document
   */
  private getFilePath(docUrl: string): string {
    // Convert automerge URL to safe filename
    // automerge:xxxxx -> xxxxx.automerge
    const docId = docUrl.replace('automerge:', '');
    return `/socialgata-favorites-${docId}.automerge`;
  }

  /**
   * Upload document to Dropbox
   */
  async upload(docUrl: string, data: Uint8Array): Promise<void> {
    if (!this.dbx) {
      throw this.createError('Not authenticated');
    }

    try {
      const path = this.getFilePath(docUrl);

      await this.dbx.filesUpload({
        path,
        contents: data,
        mode: { '.tag': 'overwrite' },
        autorename: false,
        mute: true,
      });

      console.log(`DropboxSyncProvider: Uploaded ${path}`);
    } catch (error) {
      throw this.createError('Upload failed', error);
    }
  }

  /**
   * Download document from Dropbox
   */
  async download(docUrl: string): Promise<Uint8Array | null> {
    if (!this.dbx) {
      throw this.createError('Not authenticated');
    }

    try {
      const path = this.getFilePath(docUrl);

      const response = await this.dbx.filesDownload({ path });

      // @ts-expect-error - Dropbox SDK typing issue
      const fileBlob = response.result.fileBlob as Blob;
      const arrayBuffer = await fileBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log(`DropboxSyncProvider: Downloaded ${path}`);
      return uint8Array;
    } catch (error) {
      // File not found is not an error - return null
      const err = error as { status?: number; error?: { error_summary?: string } };
      if (err?.status === 409 || err?.error?.error_summary?.includes('not_found')) {
        console.log(`DropboxSyncProvider: File not found ${this.getFilePath(docUrl)}`);
        return null;
      }
      throw this.createError('Download failed', error);
    }
  }

  /**
   * Get document metadata
   */
  async getMetadata(docUrl: string): Promise<CloudSyncMetadata | null> {
    if (!this.dbx) {
      throw this.createError('Not authenticated');
    }

    try {
      const path = this.getFilePath(docUrl);

      const response = await this.dbx.filesGetMetadata({ path });

      if (response.result['.tag'] === 'file') {
        return {
          lastModified: new Date(response.result.server_modified),
          size: response.result.size,
          version: response.result.rev,
        };
      }

      return null;
    } catch (error) {
      // File not found is not an error - return null
      const err = error as { status?: number; error?: { error_summary?: string } };
      if (err?.status === 409 || err?.error?.error_summary?.includes('not_found')) {
        return null;
      }
      throw this.createError('Get metadata failed', error);
    }
  }

  /**
   * Delete document from Dropbox
   */
  async delete(docUrl: string): Promise<void> {
    if (!this.dbx) {
      throw this.createError('Not authenticated');
    }

    try {
      const path = this.getFilePath(docUrl);
      await this.dbx.filesDeleteV2({ path });
      console.log(`DropboxSyncProvider: Deleted ${path}`);
    } catch (error) {
      // File not found is not an error
      const err = error as { status?: number; error?: { error_summary?: string } };
      if (err?.status === 409 || err?.error?.error_summary?.includes('not_found')) {
        return;
      }
      throw this.createError('Delete failed', error);
    }
  }

  /**
   * Create CloudSyncError
   */
  private createError(message: string, originalError?: unknown): CloudSyncError {
    const error = new Error(message) as CloudSyncError;
    const err = originalError as { status?: number; code?: string };
    error.name = 'CloudSyncError';
    // @ts-expect-error - Adding custom properties
    error.provider = this.providerId;
    // @ts-expect-error - Adding custom properties
    error.code = err?.status?.toString() || err?.code;
    // @ts-expect-error - Adding custom properties
    error.originalError = originalError;
    return error;
  }
}
