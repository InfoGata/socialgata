import { usePlugins } from "@/hooks/usePlugins";
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
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);

  React.useEffect(() => {
    const getLoginStatus = async () => {
      if (plugin) {
        setHasLogin(await plugin.hasDefined.onLogin());
        if (await plugin.hasDefined.onIsLoggedIn()) {
          setIsLoggedIn(await plugin.remote.onIsLoggedIn());
        }
      }
    };
    getLoginStatus();
  }, [plugin]);

  React.useEffect(() => {
    const getInstances = async () => {
      if (plugin && await plugin.hasDefined.onGetInstances()) {
        setHasInstances(true);
      } else {
        setHasInstances(false);
      }
    };
    getInstances();
  }, [plugin]);

  React.useEffect(() => {
    const checkTrending = async () => {
      if (plugin && await plugin.hasDefined.onGetTrendingTopics()) {
        setHasTrending(true);
      } else {
        setHasTrending(false);
      }
    };
    checkTrending();
  }, [plugin]);
  return (
    <div data-testid={`plugin-feed-${pluginId}`}>
      <div className="flex gap-2 justify-between border p-2 items-center">
        {plugin?.name}
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
