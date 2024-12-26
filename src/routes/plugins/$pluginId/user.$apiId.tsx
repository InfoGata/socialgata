import PostComponent from "@/components/PostComponent";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";
import React from "react";

const UserOverview: React.FC = () => {
  const data = Route.useLoaderData();
  return (
    <div>
      {data.map((d) => (
        <PostComponent post={d} />
      ))}
    </div>
  );
};

export const Route = createFileRoute("/plugins/$pluginId/user/$apiId")({
  component: UserOverview,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service) {
      const overview = await service.getUser({ apiId: params.apiId });
      return overview.items;
    } else {
      throw notFound();
    }
  },
});
