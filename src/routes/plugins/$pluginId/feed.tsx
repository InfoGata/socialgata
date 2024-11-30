import PostComponent from '@/components/PostComponent';
import { getService } from '@/services/selector-service';
import { createFileRoute, notFound } from '@tanstack/react-router'

const Feed: React.FC = () => {
  const data = Route.useLoaderData();
  return (
    <div>
      {data.items.map((item) => (
        <PostComponent key={item.title} post={item} />
      ))}
    </div>
  );
};

export const Route = createFileRoute('/plugins/$pluginId/feed')({
  component: Feed,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getFeed) {
      const response = await service.getFeed();
      return response;
    } else {
      throw notFound();
    }
  },
})