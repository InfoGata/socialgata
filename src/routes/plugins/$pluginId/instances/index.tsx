import InstanceCard from '@/components/InstanceCard';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Instances: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {data.instances.map((instance) => (
      <InstanceCard key={instance.apiId} instance={instance} pluginId={params.pluginId} />
    ))}
  </div>
}

export const Route = createFileRoute('/plugins/$pluginId/instances/')({
  component: Instances,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getInstances) {
      const response = await service.getInstances();
      return response;
    } else {
      throw notFound();
    }
  }
})