import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { useTranslation } from "react-i18next";
import Spinner from "@/components/Spinner";
import { db } from "@/database";
import { usePlugins } from "@/hooks/usePlugins";
import { getPluginUrl } from "@/plugin-utils";

const PluginOptions: React.FC = () => {
  const { pluginId } = Route.useParams();
  const { plugins, pluginMessage, pluginsLoaded } = usePlugins();
  const ref = React.useRef<HTMLIFrameElement>(null);
  const plugin = plugins.find((p) => p.id === pluginId);
  const [optionsHtml, setOptionsHtml] = React.useState<string>();
  const { t } = useTranslation();

  React.useEffect(() => {
    const getOptionsHtml = async () => {
      const pluginData = await db.plugins.get(plugin?.id || "");
      setOptionsHtml(pluginData?.optionsHtml);
    };

    getOptionsHtml();
  }, [plugin]);

  const iframeListener = React.useCallback(
    async (event: MessageEvent<unknown>) => {
      if (ref.current?.contentWindow === event.source && plugin) {
        if (await plugin.hasDefined.onUiMessage()) {
          plugin.remote.onUiMessage(event.data);
        }
      }
    },
    [plugin]
  );

  React.useEffect(() => {
    window.addEventListener("message", iframeListener);
    return () => window.removeEventListener("message", iframeListener);
  }, [iframeListener]);

  React.useEffect(() => {
    if (pluginMessage?.pluginId === plugin?.id) {
      ref.current?.contentWindow?.postMessage(pluginMessage?.message, "*");
    }
  }, [pluginMessage, plugin?.id]);

  const iframeOnload = async () => {
    const pluginData = await db.plugins.get(plugin?.id || "");
    if (pluginData) {
      ref.current?.contentWindow?.postMessage(
        {
          type: "init",
          srcdoc: pluginData?.optionsHtml,
        },
        "*"
      );
      if (ref.current) {
        ref.current.style.visibility = "visible";
      }
    }
  };

  if (!pluginsLoaded) {
    return <Spinner />;
  }
  if (!plugin) return <>{t("common.notFound", "Not found")}</>;

  const sandbox =
    "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin";
  const srcUrl = getPluginUrl(plugin.id || "", "/ui.html");
  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold">
          {t("plugins.pluginOptions", { pluginName: plugin.name, defaultValue: "{{pluginName}} Options" })}
        </h1>
      </div>
      {optionsHtml && (
        <iframe
          ref={ref}
          name={plugin.id}
          title={plugin.name}
          sandbox={sandbox}
          src={srcUrl.toString()}
          onLoad={iframeOnload}
          width="100%"
          frameBorder={0}
          style={{ height: "80vh", visibility: "hidden" }}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute("/plugins/$pluginId/options")({
  component: PluginOptions,
});
