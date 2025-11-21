import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { getService } from "@/services/selector-service";
import React from "react";

type BrowseCommunitiesButtonProps = {
  pluginId: string;
  instanceId?: string;
}

const BrowseCommunitiesButton: React.FC<BrowseCommunitiesButtonProps> = ({ pluginId, instanceId }) => {
  const service = getService(pluginId);

  if (!instanceId || !service?.getCommunities) {
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
