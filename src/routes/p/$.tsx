import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/p/$")({
  beforeLoad: ({ params, location }) => {
    const splatPath = params._splat ?? "";

    const segments = splatPath.split("/");
    const expanded = segments.map((seg, i) => {
      if (seg === "i" && i === 1) return "instances";
      if (seg === "c") return "community";
      return seg;
    });

    const fullPath = "/plugins/" + expanded.join("/");
    throw redirect({
      to: fullPath,
      search: location.search,
    });
  },
});
