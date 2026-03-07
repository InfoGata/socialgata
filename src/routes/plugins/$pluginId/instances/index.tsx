import InstanceCard from '@/components/InstanceCard';
import { usePlugins } from '@/hooks/usePlugins';
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Globe } from 'lucide-react';

const Instances: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === params.pluginId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {plugin?.name ? `${plugin.name} Instances` : 'Instances'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.instances.length} {data.instances.length === 1 ? 'instance' : 'instances'} available
          </p>
        </div>
      </div>

      {/* Instances Grid */}
      {data.instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Globe className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No instances found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.instances.map((instance) => (
            <InstanceCard key={instance.apiId} instance={instance} pluginId={params.pluginId} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/plugins/$pluginId/instances/')({
  component: Instances,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find(p => p.id === params.pluginId);
    if (plugin && await plugin.hasDefined.onGetInstances()) {
      const response = await plugin.remote.onGetInstances();
      return response;
    } else {
      throw notFound();
    }
  }
})