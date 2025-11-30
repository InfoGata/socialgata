import { PluginInterface, PluginFrame } from "plugin-frame";
import React from "react";
import { db } from "../database";
import { builtinPlugins } from "../builtin-plugins";
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
  PluginInfo,
} from "../plugintypes";
import { Theme, useTheme } from "@infogata/shadcn-vite-theme-provider";
import { NetworkRequest } from "../types";
import {
  getPlugin,
  getPluginUrl,
  isAuthorizedDomain,
} from "../plugin-utils";
import { hasExtension } from "@/utils";

interface ApplicationPluginInterface extends PluginInterface {
  networkRequest(input: string, init?: RequestInit): Promise<NetworkRequest>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postUiMessage(message: any): Promise<void>;
  getCorsProxy(): Promise<string | undefined>;
  isLoggedIn(): Promise<boolean>;
  getTheme(): Promise<Theme>;
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
  onLogin(request: LoginRequest): Promise<void>;
  onLogout(): Promise<void>;
  onIsLoggedIn(): Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUiMessage(message: any): Promise<void>;
  onPostLogin(): Promise<void>;
  onPostLogout(): Promise<void>;
  onChangeTheme(theme: Theme): Promise<void>;
  onGetPlatformType(): Promise<"forum" | "microblog" | "imageboard">;
}

export interface PluginMessage {
  pluginId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
}

export class PluginFrameContainer extends PluginFrame<PluginMethodInterface> {
  name?: string;
  id?: string;
  hasOptions?: boolean;
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
  preinstallComplete: boolean;
  reloadPlugins: () => Promise<void>;
}

export const PluginsContext = React.createContext<PluginContextInterface | undefined>(undefined);

export const PluginsProvider: React.FC<React.PropsWithChildren> = (props) => {
  const [pluginsLoaded, setPluginsLoaded] = React.useState(false);
  const [pluginsFailed, setPluginsFailed] = React.useState(false);
  const [pluginFrames, setPluginFrames] = React.useState<PluginFrameContainer[]>([]);
  const [pluginMessage, setPluginMessage] = React.useState<PluginMessage>();
  const [preinstallComplete, setPreinstallComplete] = React.useState(false);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        getTheme: async () => themeRef.current
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
        },
        frameSrc: srcUrl,
        sandboxAttributes: ["allow-scripts", "allow-same-origin"],
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

      // Check if plugin already exists
      const existingPlugin = await db.plugins.get(id);
      if (existingPlugin) {
        throw new Error(`Plugin with id ${id} already exists`);
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

  // Pre-install default plugins
  React.useEffect(() => {
    const preinstall = async () => {
      if (pluginsLoaded && !preinstallComplete) {
        const preinstallPlugins = builtinPlugins.filter((p) => !!p.preinstall);
        const existingPluginIds = pluginFrames.map((p) => p.id);
        const newPlugins = preinstallPlugins.filter(
          (p) => !existingPluginIds.includes(p.id)
        );

        for (const defaultPlugin of newPlugins) {
          try {
            if (!defaultPlugin.url) continue;
            const fileType = { url: { url: defaultPlugin.url } };
            const plugin = await getPlugin(fileType, true);
            if (plugin) {
              plugin.id = defaultPlugin.id;
              await addPlugin(plugin);
            }
          } catch (error) {
            console.error(`Failed to preinstall plugin ${defaultPlugin.name}:`, error);
          }
        }

        setPreinstallComplete(true);
      }
    };

    preinstall();
  }, [pluginsLoaded, preinstallComplete, pluginFrames, addPlugin]);

  const value: PluginContextInterface = {
    addPlugin,
    updatePlugin,
    deletePlugin,
    plugins: pluginFrames,
    pluginMessage,
    pluginsLoaded,
    pluginsFailed,
    preinstallComplete,
    reloadPlugins,
  };

  return (
    <PluginsContext.Provider value={value}>
      {props.children}
    </PluginsContext.Provider>
  );
};
