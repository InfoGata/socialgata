import { Community } from "@/plugintypes";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
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
              {community.instanceId ? (
                <Link
                  to="/plugins/$pluginId/instances/$instanceId/community/$apiId"
                  params={{
                    pluginId,
                    instanceId: community.instanceId,
                    apiId: community.apiId,
                  }}
                  className="hover:underline"
                >
                  {community.name}
                </Link>
              ) : (
                <Link
                  to="/plugins/$pluginId/community/$apiId"
                  params={{
                    pluginId,
                    apiId: community.apiId,
                  }}
                  className="hover:underline"
                >
                  {community.name}
                </Link>
              )}
            </CardTitle>
            {community.description && (
              <CardDescription className="mt-2">{community.description}</CardDescription>
            )}
            {community.originalUrl && (
              <a
                href={community.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                <span>View original</span>
              </a>
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
