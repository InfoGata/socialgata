import type { CloudSyncProvider } from "./CloudSyncProvider";
import { CloudSyncError } from "./CloudSyncProvider";
import type { PluginFrameContainer } from "@/contexts/PluginsContext";

/**
 * Adapter that wraps a sync-capable PluginFrameContainer to implement CloudSyncProvider.
 * Allows plugins to be used as cloud sync providers.
 */
export class PluginSyncProviderAdapter implements CloudSyncProvider {
  readonly pluginId: string;

  constructor(private plugin: PluginFrameContainer) {
    this.pluginId = plugin.id || "unknown";
  }

  async upload(docUrl: string, data: Uint8Array): Promise<void> {
    if (!(await this.plugin.hasDefined.onSyncUpload())) {
      throw this.createError("Plugin does not implement onSyncUpload");
    }

    // Convert Uint8Array to Base64
    const base64Data = this.uint8ArrayToBase64(data);

    const response = await this.plugin.remote.onSyncUpload({
      docUrl,
      data: base64Data,
    });

    if (!response.success) {
      throw this.createError(response.error || "Upload failed");
    }
  }

  async download(docUrl: string): Promise<Uint8Array | null> {
    if (!(await this.plugin.hasDefined.onSyncDownload())) {
      throw this.createError("Plugin does not implement onSyncDownload");
    }

    const response = await this.plugin.remote.onSyncDownload({ docUrl });

    if (response.error) {
      throw this.createError(response.error);
    }

    if (!response.data) {
      return null;
    }

    // Convert Base64 back to Uint8Array
    return this.base64ToUint8Array(response.data);
  }

  private createError(message: string): CloudSyncError {
    return new CloudSyncError(message, this.pluginId);
  }

  private uint8ArrayToBase64(data: Uint8Array): string {
    let binary = "";
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
