import { getService } from '@/services/selector-service';
import { TrendingTopic } from '@/plugintypes';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TrendingTopics: React.FC = () => {
  const data = Route.useLoaderData();
  const params = Route.useParams();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Trending Topics</h1>
      <div className="grid gap-4">
        {data.items.map((topic: TrendingTopic, index: number) => (
          <Card key={index} className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>
                <Link
                  to="/plugins/$pluginId/trending/$topicName"
                  params={{
                    pluginId: params.pluginId,
                    topicName: encodeURIComponent(topic.name)
                  }}
                  className="text-primary hover:underline"
                >
                  {topic.name}
                </Link>
              </CardTitle>
            </CardHeader>
            {topic.history && topic.history.length > 0 && (
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Uses today: {topic.history[0].uses}</p>
                  <p>Accounts: {topic.history[0].accounts}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute('/plugins/$pluginId/trending/')({
  component: TrendingTopics,
  loader: async ({ params }) => {
    const service = getService(params.pluginId);
    if (service && service.getTrendingTopics) {
      const response = await service.getTrendingTopics();
      return response;
    }
    throw notFound();
  }
});