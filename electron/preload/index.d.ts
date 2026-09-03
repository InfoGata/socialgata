import { ElectronAPI } from "@electron-toolkit/preload";

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

export interface SocialGataApi {
  pageContextFetch(
    url: string,
    init?: PageContextInit
  ): Promise<PageContextResponse>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: SocialGataApi;
  }
}
