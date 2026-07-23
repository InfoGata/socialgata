import { toContentPath } from "@/lib/plugin-route";
import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The old short url form, from before `/s` existed. Its `i`/`c` segments are
 * now the canonical ones, so this only has to swap the prefix and resolve the
 * plugin segment to the current alias.
 */
export const Route = createFileRoute("/p/$")({
  beforeLoad: ({ params, location }) => {
    const [pluginSegment = "", ...rest] = (params._splat ?? "")
      .split("/")
      .filter(Boolean);

    throw redirect({
      to: toContentPath(pluginSegment, rest),
      search: location.search,
      replace: true,
    });
  },
});
