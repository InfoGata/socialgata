import { Community } from "@/plugintypes";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Link } from "@tanstack/react-router";

interface CommunityCardProps {
  community: Community;
  pluginId: string;
}

const CommunityCard: React.FC<CommunityCardProps> = (props) => {
  const { community, pluginId } = props;
  return (
    <Card className="flex flex-col hover:bg-accent transition-colors">
      <CardHeader>
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
      </CardHeader>
    </Card>
  );
}

export default CommunityCard;
