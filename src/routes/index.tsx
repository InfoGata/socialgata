import PluginFeedButtons from "@/components/PluginFeedButttons";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

const pluginIds = ["reddit", "mastodon", "lemmy", "hackernews", "bluesky", "twitter"];

export const Index: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      {pluginIds.map((pluginId) => (
        <PluginFeedButtons key={pluginId} pluginId={pluginId} />
      ))}
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
