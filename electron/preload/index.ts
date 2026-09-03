import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

export type PageContextResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
};

export type PageContextInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

/**
 * Issues a request from a page on the target site rather than from this
 * renderer. Needed for sites that answer on where the request came from — see
 * `electron/main/page-context.ts`.
 */
const api = {
  pageContextFetch: (
    url: string,
    init?: PageContextInit
  ): Promise<PageContextResponse> =>
    ipcRenderer.invoke("page-context-fetch", url, init),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error Fallback for non-isolated context
  window.electron = electronAPI;
  // @ts-expect-error Fallback for non-isolated context
  window.api = api;
}
