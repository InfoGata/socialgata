import { PluginInterface, PluginFrame } from "plugin-frame";
import React from "react";
import { toast } from "sonner";
import { db } from "../database";
import ConfirmUpdatePluginDialog from "../components/Plugins/ConfirmUpdatePluginDialog";
import {
  GetFeedRequest,
  GetFeedResponse,
  GetCommunitiesRequest,
  GetCommunitiesResponse,
  GetCommunityRequest,
  GetCommunityResponse,
  GetCommentsRequest,
  GetCommentsResponse,
  GetCommentRepliesRequest,
  GetCommentRepliesResponse,
  GetUserRequest,
  GetUserResponse,
  SearchRequest,
  SearchResponse,
  GetTrendingTopicsRequest,
  GetTrendingTopicsResponse,
  GetTrendingTopicFeedRequest,
  GetTrendingTopicFeedResponse,
  GetInstancesRequest,
  GetInstancesResponse,
  LoginRequest,
  LoginResponse,
  LoginCallbackRequest,
  PluginInfo,
  SyncUploadRequest,
  SyncUploadResponse,
  SyncDownloadRequest,
  SyncDownloadResponse,
  NotificationMessage,
} from "../plugintypes";
import { Theme, useTheme } from "@infogata/shadcn-vite-theme-provider";
import { NetworkRequest } from "../types";
import {
  getFileTypeFromPluginUrl,
  getPlugin,
  getPluginUrl,
  isAuthorizedDomain,
} from "../plugin-utils";
import { hasExtension } from "@/utils";

interface ApplicationPluginInterface extends PluginInterface {
  networkRequest(input: string, init?: RequestInit): Promise<NetworkRequest>;
   
  postUiMessage(message: any): Promise<void>;
  getCorsProxy(): Promise<string | undefined>;
  isLoggedIn(): Promise<boolean>;
  getTheme(): Promise<Theme>;
  createNotification(notification: NotificationMessage): Promise<void>;
}

export interface PluginMethodInterface {
  onGetInstances(request?: GetInstancesRequest): Promise<GetInstancesResponse>;
  onGetFeed(request?: GetFeedRequest): Promise<GetFeedResponse>;
  onGetCommunity(request: GetCommunityRequest): Promise<GetCommunityResponse>;
  onGetCommunities(request: GetCommunitiesRequest): Promise<GetCommunitiesResponse>;
  onGetComments(request: GetCommentsRequest): Promise<GetCommentsResponse>;
  onGetCommentReplies(request: GetCommentRepliesRequest): Promise<GetCommentRepliesResponse>;
  onGetUser(request: GetUserRequest): Promise<GetUserResponse>;
  onSearch(request: SearchRequest): Promise<SearchResponse>;
  onGetTrendingTopics(request?: GetTrendingTopicsRequest): Promise<GetTrendingTopicsResponse>;
  onGetTrendingTopicFeed(request: GetTrendingTopicFeedRequest): Promise<GetTrendingTopicFeedResponse>;
  onLogin(request: LoginRequest): Promise<LoginResponse | void>;
  onLoginCallback(request: LoginCallbackRequest): Promise<void>;
  onLogout(): Promise<void>;
  onIsLoggedIn(): Promise<boolean>;
   
  onUiMessage(message: any): Promise<void>;
  onPostLogin(): Promise<void>;
  onPostLogout(): Promise<void>;
  onChangeTheme(theme: Theme): Promise<void>;
  onGetPlatformType(): Promise<"forum" | "microblog" | "imageboard">;
  // Cloud Sync Provider Methods (optional)
  onSyncUpload(request: SyncUploadRequest): Promise<SyncUploadResponse>;
  onSyncDownload(request: SyncDownloadRequest): Promise<SyncDownloadResponse>;
}

export interface PluginMessage {
  pluginId?: string;
   
  message: any;
}

// eslint-disable-next-line react-refresh/only-export-components
export class PluginFrameContainer extends PluginFrame<PluginMethodInterface> {
  name?: string;
  id?: string;
  hasOptions?: boolean;
  hasFeed?: boolean;
  fileList?: FileList;
  optionsSameOrigin?: boolean;
  version?: string;
  manifestUrl?: string;
  platformType?: "forum" | "microblog" | "imageboard";
}

export interface PluginContextInterface {
  addPlugin: (plugin: PluginInfo, pluginFiles?: FileList) => Promise<void>;
  updatePlugin: (
    plugin: PluginInfo,
    id: string,
    pluginFiles?: FileList
  ) => Promise<void>;
  deletePlugin: (plugin: PluginFrameContainer) => Promise<void>;
  plugins: PluginFrameContainer[];
  pluginMessage?: PluginMessage;
  pluginsLoaded: boolean;
  pluginsFailed: boolean;
  reloadPlugins: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const PluginsContext = React.createContext<PluginContextInterface | undefined>(undefined);

export const PluginsProvider: React.FC<React.PropsWithChildren> = (props) => {
  const [pluginsLoaded, setPluginsLoaded] = React.useState(false);
  const [pluginsFailed, setPluginsFailed] = React.useState(false);
  const [pluginFrames, setPluginFrames] = React.useState<PluginFrameContainer[]>([]);
  const [pluginMessage, setPluginMessage] = React.useState<PluginMessage>();
  const [pendingUpdatePlugin, setPendingUpdatePlugin] = React.useState<PluginInfo | null>(null);

  const corsProxyUrl = "";  // TODO: Add CORS proxy support if needed
  const theme = useTheme();
  const themeRef = React.useRef(theme.theme);
  themeRef.current = theme.theme;

  const loadPlugin = React.useCallback(
    async (plugin: PluginInfo, pluginFiles?: FileList) => {
      const api: ApplicationPluginInterface = {
        networkRequest: async (input: string, init?: RequestInit) => {
          if (hasExtension() && window.InfoGata?.networkRequest) {
            return await window.InfoGata.networkRequest(input, init);
          }
          const pluginAuth = plugin?.id
            ? await db.pluginAuths.get(plugin.id)
            : undefined;
          const newInit = init ?? {};

          if (
            !plugin?.manifest?.authentication ||
            !isAuthorizedDomain(
              input,
              plugin.manifest.authentication.loginUrl,
              plugin.manifest.authentication.domainHeadersToFind
            )
          ) {
            newInit.credentials = "omit";
          }

          if (pluginAuth) {
            if (Object.keys(pluginAuth.headers).length > 0) {
              const headers = new Headers(newInit.headers);
              for (const prop in pluginAuth.headers) {
                headers.set(prop, pluginAuth.headers[prop]);
              }
              newInit.headers = Object.fromEntries(headers.entries());
            } else if (Object.keys(pluginAuth.domainHeaders ?? {}).length > 0) {
              const url = new URL(input);
              const domainHeaderKey = Object.keys(
                pluginAuth.domainHeaders ?? {}
              ).find((d) => url.host.endsWith(d));
              if (domainHeaderKey) {
                const domainHeaders = pluginAuth.domainHeaders![domainHeaderKey];
                const headers = new Headers(newInit.headers);
                for (const prop in domainHeaders) {
                  headers.set(prop, domainHeaders[prop]);
                }
                newInit.headers = Object.fromEntries(headers.entries());
              }
            }
          }

          const response = await fetch(input, newInit);
          const body = await response.blob();
          const result: NetworkRequest = {
            body,
            headers: Object.fromEntries(response.headers.entries()),
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          };
          return result;
        },
         
        postUiMessage: async (message: any) => {
          setPluginMessage({ pluginId: plugin.id, message });
        },
        getCorsProxy: async () => corsProxyUrl || undefined,
        isLoggedIn: async () => {
          if (plugin?.id) {
            const auth = await db.pluginAuths.get(plugin.id);
            return !!auth;
          }
          return false;
        },
        getTheme: async () => themeRef.current,
        createNotification: async (notification: NotificationMessage) => {
          let toaster = toast.message;
          switch (notification.type) {
            case "error":
              toaster = toast.error;
              break;
            case "success":
              toaster = toast.success;
              break;
            case "info":
              toaster = toast.info;
              break;
            case "warning":
              toaster = toast.warning;
              break;
          }
          toaster(notification.message);
        },
      };

      const srcUrl = getPluginUrl(plugin.id!, "/pluginframe.html");
      const host = new PluginFrameContainer(api, {
        completeMethods: {
          onGetFeed: (feed: GetFeedResponse) => {
            feed?.items.forEach((i) => (i.pluginId = plugin.id));
            return feed;
          },
          onSearch: (feed: SearchResponse) => {
            feed?.items.forEach((i) => (i.pluginId = plugin.id));
            return feed;
          },
          onGetTrendingTopicFeed: (feed: GetTrendingTopicFeedResponse) => {
            feed?.items.forEach((i) => (i.pluginId = plugin.id));
            return feed;
          },
          onGetCommunity: (response: GetCommunityResponse) => {
            response?.items.forEach((i) => (i.pluginId = plugin.id));
            return response;
          },
        },
        frameSrc: srcUrl,
        sandboxAttributes: ["allow-scripts", "allow-same-origin", "allow-popups"],
      });

      host.name = plugin.name;
      host.id = plugin.id;
      host.version = plugin.version;
      host.hasOptions = !!plugin.optionsHtml;
      host.fileList = pluginFiles;
      host.optionsSameOrigin = plugin.optionsSameOrigin;
      host.manifestUrl = plugin.manifestUrl;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Plugin load timeout")), 10000)
      );

      try {
        await Promise.race([host.ready(), timeoutPromise]);
        await host.executeCode(plugin.script);

        // Try to get platform type from plugin
        host.hasFeed = await host.hasDefined.onGetFeed();

        if (await host.hasDefined.onGetPlatformType()) {
          host.platformType = await host.remote.onGetPlatformType();
        }
      } catch (error) {
        console.error(`Failed to load plugin ${plugin.name}:`, error);
        throw error;
      }

      return host;
    },
    []
  );

  const addPlugin = React.useCallback(
    async (plugin: PluginInfo, pluginFiles?: FileList) => {
      const id = plugin.id;
      if (!id) {
        throw new Error("Plugin must have an id");
      }

      // Check if plugin already exists - prompt for update instead of throwing
      const existingPlugin = await db.plugins.get(id);
      if (existingPlugin) {
        setPendingUpdatePlugin(plugin);
        return;
      }

      // Save to database
      await db.plugins.add(plugin);

      // Load the plugin
      const pluginFrame = await loadPlugin(plugin, pluginFiles);
      setPluginFrames((prev) => [...prev, pluginFrame]);
    },
    [loadPlugin]
  );

  const updatePlugin = React.useCallback(
    async (plugin: PluginInfo, id: string) => {
      await db.plugins.update(id, plugin);

      // Reload all plugins - note: reloadPlugins is defined below
      setPluginsLoaded(false);
      setPluginsFailed(false);

      try {
        const dbPlugins = await db.plugins.toArray();
        const loadedPlugins: PluginFrameContainer[] = [];

        for (const dbPlugin of dbPlugins) {
          try {
            const pluginFrame = await loadPlugin(dbPlugin);
            loadedPlugins.push(pluginFrame);
          } catch (error) {
            console.error(`Failed to load plugin ${dbPlugin.name}:`, error);
          }
        }

        setPluginFrames(loadedPlugins);
        setPluginsLoaded(true);
      } catch (error) {
        console.error("Failed to reload plugins:", error);
        setPluginsFailed(true);
      }
    },
    [loadPlugin]
  );

  const deletePlugin = React.useCallback(
    async (plugin: PluginFrameContainer) => {
      if (!plugin.id) return;

      await db.plugins.delete(plugin.id);
      await db.pluginAuths.delete(plugin.id);

      setPluginFrames((prev) => prev.filter((p) => p.id !== plugin.id));
    },
    []
  );

  const reloadPlugins = React.useCallback(async () => {
    setPluginsLoaded(false);
    setPluginsFailed(false);

    try {
      const dbPlugins = await db.plugins.toArray();
      const loadedPlugins: PluginFrameContainer[] = [];

      for (const plugin of dbPlugins) {
        try {
          const pluginFrame = await loadPlugin(plugin);
          loadedPlugins.push(pluginFrame);
        } catch (error) {
          console.error(`Failed to load plugin ${plugin.name}:`, error);
        }
      }

      setPluginFrames(loadedPlugins);
      setPluginsLoaded(true);
    } catch (error) {
      console.error("Failed to reload plugins:", error);
      setPluginsFailed(true);
    }
  }, [loadPlugin]);

  // Load plugins on mount
  React.useEffect(() => {
    reloadPlugins();
  }, [reloadPlugins]);

  // Auto-poll localhost plugins for changes during development
  const updatePluginRef = React.useRef(updatePlugin);
  updatePluginRef.current = updatePlugin;
  React.useEffect(() => {
    if (!pluginsLoaded) return;

    const DEV_POLL_INTERVAL = 3000;
    const scriptCache = new Map<string, string>();

    const checkForUpdates = async () => {
      const dbPlugins = await db.plugins.toArray();
      const localhostPlugins = dbPlugins.filter(
        (p) => p.manifestUrl && new URL(p.manifestUrl).hostname === "localhost"
      );

      for (const dbPlugin of localhostPlugins) {
        try {
          const fileType = getFileTypeFromPluginUrl(dbPlugin.manifestUrl!);
          const newPlugin = await getPlugin(fileType, true);
          if (!newPlugin || !dbPlugin.id) continue;

          const cached = scriptCache.get(dbPlugin.id);
          if (cached === undefined) {
            // First check — seed cache, don't update
            scriptCache.set(dbPlugin.id, newPlugin.script);
            continue;
          }

          if (newPlugin.script !== cached) {
            scriptCache.set(dbPlugin.id, newPlugin.script);
            newPlugin.id = dbPlugin.id;
            newPlugin.manifestUrl = dbPlugin.manifestUrl;
            console.log(`[dev] Auto-updating plugin: ${newPlugin.name}`);
            await updatePluginRef.current(newPlugin, dbPlugin.id);
          }
        } catch {
          // Server might be down, ignore
        }
      }
    };

    const interval = setInterval(checkForUpdates, DEV_POLL_INTERVAL);
    // Run immediately to seed cache
    checkForUpdates();

    return () => clearInterval(interval);
  }, [pluginsLoaded]);

  const handleConfirmUpdate = React.useCallback(async () => {
    if (pendingUpdatePlugin?.id) {
      await updatePlugin(pendingUpdatePlugin, pendingUpdatePlugin.id);
      setPendingUpdatePlugin(null);
    }
  }, [pendingUpdatePlugin, updatePlugin]);

  const handleCloseUpdate = React.useCallback(() => {
    setPendingUpdatePlugin(null);
  }, []);

  const value: PluginContextInterface = {
    addPlugin,
    updatePlugin,
    deletePlugin,
    plugins: pluginFrames,
    pluginMessage,
    pluginsLoaded,
    pluginsFailed,
    reloadPlugins,
  };

  return (
    <PluginsContext.Provider value={value}>
      {props.children}
      <ConfirmUpdatePluginDialog
        open={!!pendingUpdatePlugin}
        plugin={pendingUpdatePlugin}
        onConfirm={handleConfirmUpdate}
        onClose={handleCloseUpdate}
      />
    </PluginsContext.Provider>
  );
};
