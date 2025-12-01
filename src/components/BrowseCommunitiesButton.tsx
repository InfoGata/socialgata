import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { usePlugins } from "@/hooks/usePlugins";
import React from "react";

type BrowseCommunitiesButtonProps = {
  pluginId: string;
  instanceId?: string;
}

const BrowseCommunitiesButton: React.FC<BrowseCommunitiesButtonProps> = ({ pluginId, instanceId }) => {
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);
  const [hasCommunities, setHasCommunities] = React.useState(false);

  React.useEffect(() => {
    const checkCommunities = async () => {
      if (plugin && await plugin.hasDefined.onGetCommunities()) {
        setHasCommunities(true);
      } else {
        setHasCommunities(false);
      }
    };
    checkCommunities();
  }, [plugin]);

  if (!instanceId || !hasCommunities) {
    return null;
  }

  return (
    <div className="mb-3">
      <Button variant="outline" size="sm" asChild>
        <Link
          to="/plugins/$pluginId/instances/$instanceId/communities"
          params={{ pluginId, instanceId }}
          className="flex items-center gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Browse Communities</span>
        </Link>
      </Button>
    </div>
  );
};

export default BrowseCommunitiesButton;
