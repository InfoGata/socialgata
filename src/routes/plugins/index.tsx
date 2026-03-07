import AddPluginUrlDialog from "@/components/Plugins/AddPluginUrlDialog";
import PluginContainer from "@/components/Plugins/PluginContainer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen, Link2, Puzzle } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import ConfirmPluginDialog from "../../components/Plugins/ConfirmPluginDialog";
import { usePlugins } from "../../hooks/usePlugins";
import { PluginInfo } from "../../plugintypes";
import { directoryProps, generatePluginId, getPlugin, FileType } from "../../plugin-utils";
import PluginCards from "@/components/PluginCards/PluginCards";

const Plugins: React.FC = () => {
  const { plugins, deletePlugin, pluginsFailed, reloadPlugins } = usePlugins();
  const { t } = useTranslation("plugins");
  const [pendingPlugin, setPendingPlugin] = React.useState<PluginInfo | null>(
    null
  );
  const [openUrlDialog, setOpenUrlDialog] = React.useState(false);

  const onCloseUrlDialog = () => setOpenUrlDialog(false);
  const onOpenUrlDialog = () => setOpenUrlDialog(true);

  const onConfirmUrlDialog = (plugin: PluginInfo) => {
    onCloseUrlDialog();
    setPendingPlugin(plugin);
  };

  const onConfirmPluginClose = () => {
    setPendingPlugin(null);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileType: FileType = {
      filelist: files,
    };
    const plugin = await getPlugin(fileType);

    if (plugin) {
      if (!plugin.id) {
        plugin.id = generatePluginId();
      }
      setPendingPlugin(plugin);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Puzzle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Plugins</h1>
            <p className="text-sm text-muted-foreground">
              Manage and discover plugins for your feeds
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <label
            htmlFor="contained-button-file"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "cursor-pointer"
            )}
          >
            <input
              className="hidden"
              id="contained-button-file"
              type="file"
              {...directoryProps}
              onChange={onFileChange}
            />
            <FolderOpen className="h-4 w-4 mr-1.5" />
            {t("loadPluginFromFolder")}
          </label>
          <Button variant="outline" size="sm" onClick={onOpenUrlDialog}>
            <Link2 className="h-4 w-4 mr-1.5" />
            {t("loadPluginFromUrl")}
          </Button>
        </div>
      </div>

      {pluginsFailed && (
        <Button variant="destructive" size="sm" onClick={reloadPlugins}>
          {t("failedPlugins")}: {t("clickReload")}
        </Button>
      )}

      {/* Tabs */}
      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">
            {t("installedPlugins")}
            {plugins.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {plugins.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discover">
            {t("availablePlugins")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-4">
          {plugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Puzzle className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No plugins installed yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Browse the Discover tab to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {plugins.map((plugin) => (
                <PluginContainer
                  key={plugin.id}
                  plugin={plugin}
                  deletePlugin={deletePlugin}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-4">
          <PluginCards />
        </TabsContent>
      </Tabs>

      <ConfirmPluginDialog
        open={Boolean(pendingPlugin)}
        plugins={pendingPlugin ? [pendingPlugin] : []}
        handleClose={onConfirmPluginClose}
      />
      <AddPluginUrlDialog
        open={openUrlDialog}
        setOpen={setOpenUrlDialog}
        handleConfirm={onConfirmUrlDialog}
      />
    </div>
  );
};

export const Route = createFileRoute("/plugins/")({
  component: Plugins,
});
