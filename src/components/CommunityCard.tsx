import { Community } from "@/plugintypes";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Link } from "@tanstack/react-router";
import { FavoriteButton } from "./FavoriteButton";

interface CommunityCardProps {
  community: Community;
  pluginId: string;
}

const CommunityCard: React.FC<CommunityCardProps> = (props) => {
  const { community, pluginId } = props;
  return (
    <Card className="flex flex-col hover:bg-accent transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle>
              <Link
                to={`/plugins/$pluginId/instances/$instanceId/community/$apiId`}
                params={{
                  pluginId,
                  instanceId: community.instanceId || "",
                  apiId: community.apiId
                }}
                className="hover:underline"
              >
                {community.name}
              </Link>
            </CardTitle>
            {community.description && (
              <CardDescription className="mt-2">{community.description}</CardDescription>
            )}
          </div>
          <FavoriteButton
            type="community"
            item={community}
            pluginId={pluginId}
            size="sm"
            variant="icon"
          />
        </div>
      </CardHeader>
    </Card>
  );
}

export default CommunityCard;
