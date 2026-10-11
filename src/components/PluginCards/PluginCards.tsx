import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { defaultPlugins } from "../../default-plugins";
import { PluginDescription } from "../../types";
import { usePlugins } from "../../hooks/usePlugins";
import {
  generatePluginId,
  getFileTypeFromPluginUrl,
  getPlugin,
} from "../../plugin-utils";
import { useCorsDisabled } from "../../hooks/useCorsDisabled";
import { usePageContextSupport } from "../../hooks/usePageContextSupport";
import Spinner from "../Spinner";
import PluginCard from "./PluginCard";
import { isOfferable, needsSignIn } from "@/lib/plugin-catalog";
const PluginCards: React.FC = () => {
  const { t } = useTranslation("plugins");
  const { plugins, addPlugin, pluginsLoaded } = usePlugins();
  const [backdropOpen, setBackdropOpen] = React.useState(false);
  const corsDisabled = useCorsDisabled();
  const pageContextSupported = usePageContextSupport();

  const onAddPlugin = async (description: PluginDescription) => {
    if (!description.url) return;
    setBackdropOpen(true);
    try {
      const fileType = getFileTypeFromPluginUrl(description.url);

      const plugin = await getPlugin(fileType);

      if (plugin) {
        if (!plugin.id) {
          plugin.id = generatePluginId();
        }
        await addPlugin(plugin);
      }
    } catch (error) {
      toast.error(
        t("addPluginFailed", {
          name: description.name,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    } finally {
      setBackdropOpen(false);
    }
  };

  const pluginCards = defaultPlugins
    .filter(
      (dp) =>
        !plugins.some((p) => dp.id === p.id) &&
        isOfferable(dp, corsDisabled, pageContextSupported)
    )
    .map((dp) => (
      <PluginCard
        addPlugin={onAddPlugin}
        plugin={dp}
        needsSignIn={needsSignIn(dp, corsDisabled)}
        key={dp.id}
      />
    ));

  if (pluginCards.length === 0) return null;

  return (
    <>
      <Spinner open={backdropOpen} />
      {pluginsLoaded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in">
          {pluginCards}
        </div>
      )}
    </>
  );
};

export default PluginCards;
