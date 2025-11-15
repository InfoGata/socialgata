import { getService } from "@/services/selector-service";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useState } from "react";
import PluginLogin from "./PluginLogin";
import { buttonVariants } from "./ui/button";

interface PluginFeedButtonsProps {
  pluginId: string;
}

const PluginFeedButtons = ({ pluginId }: PluginFeedButtonsProps) => {
  const [hasInstances, setHasInstances] = useState(false);
  const [hasTrending, setHasTrending] = useState(false);
  const [hasLogin, setHasLogin] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const getLoginStatus = async () => {
      const service = getService(pluginId);
      if (service) {
        setHasLogin(!!service.login);
        if (service.isLoggedIn) {
          setIsLoggedIn(await service.isLoggedIn());
        }
      }
    };
    getLoginStatus();
  }, [pluginId]);
  React.useEffect(() => {
    const getInstances = async () => {
      const service = getService(pluginId);
      if (service && service.getInstances) {
        setHasInstances(true);
      } else {
        setHasInstances(false);
      }
    };
    getInstances();
  }, [pluginId]);

  React.useEffect(() => {
    const checkTrending = async () => {
      const service = getService(pluginId);
      if (service && service.getTrendingTopics) {
        setHasTrending(true);
      } else {
        setHasTrending(false);
      }
    };
    checkTrending();
  }, [pluginId]);
  return (
    <div data-testid={`plugin-feed-${pluginId}`}>
      <div className="flex gap-2 justify-between border p-2 items-center">
        {pluginId}
        <div className="flex gap-2">
          {hasInstances && (
            <Link
              className={buttonVariants({ variant: "default" })}
              to={`/plugins/$pluginId/instances`}
              params={{ pluginId }}
            >
              Instances
            </Link>
          )}
          {hasTrending && (
            <Link
              className={buttonVariants({ variant: "default" })}
              to={`/plugins/$pluginId/trending`}
              params={{ pluginId }}
            >
              Trending
            </Link>
          )}
          {!hasInstances && (
            <Link
              className={buttonVariants({ variant: "default" })}
              to={`/plugins/$pluginId/feed`}
              params={{ pluginId }}
            >
              Feed
            </Link>
          )}
        </div>
      </div>
      {hasLogin && (
        <PluginLogin
          pluginId={pluginId}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        />
      )}
    </div>
  );
};

export default PluginFeedButtons;
