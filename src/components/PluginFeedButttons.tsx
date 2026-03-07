import { usePlugins } from "@/hooks/usePlugins";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useState } from "react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardContent,
} from "./ui/card";
import {
  Rss,
  MessageSquare,
  Image,
  TrendingUp,
  Server,
  Puzzle,
} from "lucide-react";

interface PluginFeedButtonsProps {
  pluginId: string;
}

const platformConfig = {
  forum: {
    icon: MessageSquare,
    gradient: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  microblog: {
    icon: Rss,
    gradient: "from-purple-500/10 to-purple-600/5",
    iconColor: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  imageboard: {
    icon: Image,
    gradient: "from-green-500/10 to-green-600/5",
    iconColor: "text-green-600 dark:text-green-400",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
} as const;

const PluginFeedButtons = ({ pluginId }: PluginFeedButtonsProps) => {
  const [hasInstances, setHasInstances] = useState(false);
  const [hasTrending, setHasTrending] = useState(false);
  const { plugins } = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);

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

  const platform = plugin?.platformType
    ? platformConfig[plugin.platformType]
    : null;
  const PlatformIcon = platform?.icon ?? Puzzle;

  return (
    <Card
      data-testid={`plugin-feed-${pluginId}`}
      className="overflow-hidden transition-all hover:shadow-md hover:border-primary/30"
    >
      <CardHeader className={cn("pb-3 bg-gradient-to-r", platform?.gradient ?? "from-muted/50 to-muted/20")}>
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm")}>
            <PlatformIcon className={cn("h-5 w-5", platform?.iconColor ?? "text-muted-foreground")} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">{plugin?.name}</h3>
            {plugin?.platformType && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-0.5",
                  platform?.badge
                )}
              >
                {plugin.platformType.charAt(0).toUpperCase() + plugin.platformType.slice(1)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-4">
        <div className="flex flex-wrap gap-2">
          {!hasInstances && (
            <Link
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              to={`/plugins/$pluginId/feed`}
              params={{ pluginId }}
            >
              <Rss className="h-3.5 w-3.5 mr-1.5" />
              Feed
            </Link>
          )}
          {hasInstances && (
            <Link
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              to={`/plugins/$pluginId/instances`}
              params={{ pluginId }}
            >
              <Server className="h-3.5 w-3.5 mr-1.5" />
              Instances
            </Link>
          )}
          {hasTrending && (
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              to={`/plugins/$pluginId/trending`}
              params={{ pluginId }}
            >
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Trending
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PluginFeedButtons;
