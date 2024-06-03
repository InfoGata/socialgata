import PostComponent from "@/components/PostComponent";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";

const Community: React.FC = () => {
  const data = Route.useLoaderData();
  return (
    <div>
      {data.map((p) => (
        <PostComponent key={p.title} post={p} />
      ))}
    </div>
  );
};

export const Route = createFileRoute("/plugins/$pluginId/community/$apiId/")({
  component: Community,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getCommunity) {
      const response = await service.getCommunity(params.apiId);
      return response.items;
    } else {
      throw notFound();
    }
  },
});
