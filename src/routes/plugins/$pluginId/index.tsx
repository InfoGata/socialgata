import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/database";
import { usePlugins } from "@/hooks/usePlugins";
import { usePluginLogin } from "@/hooks/usePluginLogin";
import {
  FileType,
  directoryProps,
  getFileText,
  getFileTypeFromPluginUrl,
  getPlugin,
} from "@/plugin-utils";
import { Manifest } from "@/plugintypes";
import { PluginInfo } from "@/plugintypes";
import { Link, createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ExternalLinkIcon,
  FileCodeIcon,
  FolderUpIcon,
  InfoIcon,
  LogInIcon,
  LogOutIcon,
  RefreshCwIcon,
  RssIcon,
  SettingsIcon,
} from "lucide-react";

const PluginDetails: React.FC = () => {
  const { pluginId } = Route.useParams();
  const { updatePlugin, plugins } = usePlugins();
  const plugin = plugins.find((p) => p.id === pluginId);
  const { t } = useTranslation(["plugins", "common"]);
  const [pluginInfo, setPluginInfo] = React.useState<PluginInfo | undefined>();

  React.useEffect(() => {
    db.plugins.get(pluginId || "").then(setPluginInfo);
  }, [pluginId]);
  const { hasLogin, isLoggedIn, login, logout } = usePluginLogin(plugin);
  const [hasUpdate, setHasUpdate] = React.useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const updatePluginFromFilelist = async (files: FileList) => {
    const fileType: FileType = {
      filelist: files,
    };
    const newPlugin = await getPlugin(fileType);

    if (newPlugin && pluginInfo && pluginInfo.id) {
      newPlugin.id = pluginInfo.id;
      await updatePlugin(newPlugin, pluginInfo.id);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    await updatePluginFromFilelist(files);
    setLoading(false);
  };

  const onReload = async () => {
    if (!plugin?.fileList) return;

    setLoading(true);
    await updatePluginFromFilelist(plugin.fileList);
    setLoading(false);
  };

  const onUpdate = async () => {
    if (pluginInfo?.manifestUrl) {
      const fileType = getFileTypeFromPluginUrl(pluginInfo.manifestUrl);
      const newPlugin = await getPlugin(fileType);
      if (newPlugin && pluginInfo.id) {
        newPlugin.id = pluginInfo.id;
        newPlugin.manifestUrl = pluginInfo.manifestUrl;
        await updatePlugin(newPlugin, pluginInfo.id);
      }
    }
  };

  const checkUpdate = async () => {
    if (!isCheckingUpdate && pluginInfo?.manifestUrl) {
      setIsCheckingUpdate(true);
      const fileType = getFileTypeFromPluginUrl(pluginInfo.manifestUrl);
      const manifestText = await getFileText(fileType, "manifest.json");
      if (manifestText) {
        const manifest = JSON.parse(manifestText) as Manifest;
        if (manifest.version !== pluginInfo.version) {
          setHasUpdate(true);
          toast(t("plugins:updateFound"));
        } else {
          setHasUpdate(false);
          toast(t("plugins:noUpdateFound"));
        }
      }
      setIsCheckingUpdate(false);
    }
  };

  if (!pluginInfo) {
    return <div>{t("common:notFound")}</div>;
  }

  const scriptSize = `${(new Blob([pluginInfo.script]).size / 1000).toFixed(1)} kb`;
  const optionsSize = pluginInfo.optionsHtml
    ? `${(new Blob([pluginInfo.optionsHtml]).size / 1000).toFixed(1)} kb`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCodeIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {pluginInfo.name}
            </h1>
            {pluginInfo.version && (
              <p className="text-sm text-muted-foreground">
                v{pluginInfo.version}
              </p>
            )}
          </div>
        </div>
        {hasLogin && (
          isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              {t("plugins:logout")}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => login()}>
              <LogInIcon className="mr-2 h-4 w-4" />
              {t("plugins:login")}
            </Button>
          )
        )}
      </div>

      {pluginInfo.description && (
        <p className="text-muted-foreground">{pluginInfo.description}</p>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        {plugin?.hasFeed && (
          <Link
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            to="/plugins/$pluginId/feed"
            params={{ pluginId: pluginInfo.id || "" }}
          >
            <RssIcon className="mr-2 h-4 w-4" />
            {t("plugins:viewFeed")}
          </Link>
        )}
        {(pluginInfo.optionsHtml || plugin?.hasOptions) && (
          <Link
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            to="/plugins/$pluginId/options"
            params={{ pluginId: pluginInfo.id || "" }}
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            {t("plugins:options")}
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <InfoIcon className="h-4 w-4" />
              {t("plugins:pluginDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {pluginInfo.homepage && (
                <div>
                  <dt className="text-muted-foreground">
                    {t("plugins:homepage")}
                  </dt>
                  <dd>
                    <a
                      href={pluginInfo.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-500 hover:underline break-all"
                    >
                      {pluginInfo.homepage}
                      <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("plugins:scriptSize")}
                </span>
                <span className="font-mono">{scriptSize}</span>
              </div>
              {optionsSize && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("plugins:optionsPageSize")}
                  </span>
                  <span className="font-mono">{optionsSize}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Id</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  {pluginInfo.id}
                </span>
              </div>
              {pluginInfo.manifestUrl && (
                <div>
                  <dt className="text-muted-foreground">
                    {t("plugins:updateUrl")}
                  </dt>
                  <dd>
                    <a
                      href={pluginInfo.manifestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-500 hover:underline break-all text-xs"
                    >
                      {pluginInfo.manifestUrl}
                      <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Updates & Maintenance Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCwIcon className="h-4 w-4" />
              {t("plugins:updatePlugin")}
            </CardTitle>
            <CardDescription>
              {t("plugins:version")}: {pluginInfo.version || "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pluginInfo.manifestUrl && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={checkUpdate}
                  disabled={isCheckingUpdate}
                >
                  {t("plugins:checkForUpdates")}
                </Button>
                {hasUpdate && (
                  <Button size="sm" className="flex-1" onClick={onUpdate}>
                    {t("plugins:updatePlugin")}
                  </Button>
                )}
              </div>
            )}

            <label
              htmlFor={`update-plugin-${pluginInfo.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer w-full"
              )}
            >
              <input
                id={`update-plugin-${pluginInfo.id}`}
                type="file"
                {...directoryProps}
                onChange={onFileChange}
                className="hidden"
              />
              <FolderUpIcon className="mr-2 h-4 w-4" />
              {t("plugins:updateFromFile")}
            </label>

            {plugin?.fileList && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onReload}
                disabled={loading}
              >
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                {t("plugins:reloadPlugin")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/plugins/$pluginId/")({
  component: PluginDetails,
});
