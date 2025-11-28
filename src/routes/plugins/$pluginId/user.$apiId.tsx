import PostComponent from "@/components/PostComponent";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getService } from "@/services/selector-service";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { User as UserIcon } from "lucide-react";
import React from "react";

const UserOverview: React.FC = () => {
  const { user, items } = Route.useLoaderData();
  const { pluginId } = Route.useParams();
  const service = getService(pluginId);
  const platformType = service?.platformType || "forum";

  return (
    <div className="space-y-4">
      {user && (
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
            </div>
            <FavoriteButton
              type="user"
              item={user}
              pluginId={pluginId}
              size="lg"
              variant="button"
            />
          </div>
        </div>
      )}
      <div className="space-y-4">
        {items.map((d) => (
          <PostComponent key={d.apiId} post={d} platformType={platformType} />
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/plugins/$pluginId/user/$apiId")({
  component: UserOverview,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service) {
      if (service.getUser) {
        const response = await service.getUser({ apiId: params.apiId });
        return { user: response.user, items: response.items };
      } else {
        return { user: undefined, items: [] };
      }
    } else {
      throw notFound();
    }
  },
});
