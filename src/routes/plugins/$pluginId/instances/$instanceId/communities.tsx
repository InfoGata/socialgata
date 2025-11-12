import CommunityCard from '@/components/CommunityCard';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Communities: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();

  if (!data.items || data.items.length === 0) {
    return <div className="text-center text-muted-foreground p-8">
      No communities found for this instance.
    </div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Communities</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.items.map((community) => (
          <CommunityCard key={community.apiId} community={community} pluginId={params.pluginId} />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/plugins/$pluginId/instances/$instanceId/communities')({
  component: Communities,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getCommunities) {
      const response = await service.getCommunities({ instanceId: params.instanceId });
      return response;
    } else {
      throw notFound();
    }
  }
})
