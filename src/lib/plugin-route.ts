import PluginNotInstalled from "@/components/Plugins/PluginNotInstalled";
import { aliasForId, resolvePluginParam } from "@/lib/plugin-alias";
import type { PluginFrameContainer } from "@/contexts/PluginsContext";
import { redirect } from "@tanstack/react-router";

/**
 * Shared route options for every route under `/s/$pluginId` and
 * `/plugins/$pluginId`. They translate between the alias in the url and the
 * plugin id the app uses everywhere else, so route bodies and every `<Link
 * params={{ pluginId }}>` keep dealing in ids only.
 */

/**
 * `TExtra` names the route's other path params so they survive the round trip
 * with their types intact, e.g. `pluginIdParams<{ apiId: string }>()`.
 */
export const pluginIdParams = <
  TExtra extends Record<string, string> = Record<never, string>,
>() => ({
  parse: (raw: TExtra & { pluginId: string }) => ({
    ...raw,
    pluginId: resolvePluginParam(raw.pluginId),
  }),
  stringify: (params: TExtra & { pluginId: string }) => ({
    ...params,
    pluginId: aliasForId(params.pluginId),
  }),
});

type PluginBeforeLoadContext = {
  params: { pluginId: string };
  location: { pathname: string; search: Record<string, unknown> };
  context: { plugins: PluginFrameContainer[] };
};

/**
 * Rewrites a url that named the plugin some other way (its id, or an alias that
 * deduped differently on the device that shared it) to the canonical alias, so
 * whatever the user copies out of the address bar is the readable form.
 */
export const canonicalizePluginUrl = ({
  params,
  location,
  context,
}: PluginBeforeLoadContext) => {
  const plugin = context.plugins.find((p) => p.id === params.pluginId);
  if (!plugin?.alias) return;

  // "/s/reddit/feed" and "/plugins/reddit/options" both hold it at index 2.
  const segments = location.pathname.split("/");
  if (segments[2] === plugin.alias) return;

  segments[2] = plugin.alias;
  throw redirect({
    to: segments.join("/"),
    search: location.search,
    replace: true,
  });
};

export const pluginNotFoundComponent = PluginNotInstalled;

/**
 * Builds a canonical `/s/<alias>/...` path from a plugin segment (an id or an
 * alias) and the path below it, shortening the segments that were renamed when
 * content moved out of `/plugins`. Only the positions where those words are
 * route segments are touched, so a community named "community" survives.
 */
export const toContentPath = (pluginSegment: string, rest: string[]) => {
  const alias = aliasForId(resolvePluginParam(pluginSegment));
  const shortened = rest.map((segment, i) => {
    if (i === 0 && segment === "instances") return "i";
    const underInstance = rest[0] === "instances" || rest[0] === "i";
    if (segment === "community" && (i === 0 || (i === 2 && underInstance)))
      return "c";
    return segment;
  });
  return ["/s", alias, ...shortened].join("/");
};
