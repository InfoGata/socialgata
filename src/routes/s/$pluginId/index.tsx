import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

/** `/s/reddit` is the natural thing to type or share, so send it to the feed. */
export const Route = createFileRoute("/s/$pluginId/")({
  params: pluginIdParams(),
  notFoundComponent: pluginNotFoundComponent,
  beforeLoad: async (ctx) => {
    canonicalizePluginUrl(ctx);

    const { params, context } = ctx;
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (!plugin) throw notFound();

    throw redirect({
      to: plugin.hasFeed ? "/s/$pluginId/feed" : "/plugins/$pluginId",
      params: { pluginId: params.pluginId },
      replace: true,
    });
  },
});
