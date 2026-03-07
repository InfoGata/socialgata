import { Instance } from "@/plugintypes";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { MessageSquareTextIcon, UsersIcon, MessagesSquareIcon, ExternalLink, Layers } from "lucide-react";
import { usePlugins } from "@/hooks/usePlugins";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { FavoriteButton } from "./FavoriteButton";
import React from "react";

interface InstanceCardProps {
  instance: Instance;
  pluginId: string;
}

const InstanceCard: React.FC<InstanceCardProps> = (props) => {
  const { instance, pluginId } = props;
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
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

  const hasStats = instance.usersCount || instance.postsCount || instance.commentsCount;

  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {instance.bannerSvg ? (
          <div
            className="absolute inset-0 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(instance.bannerSvg),
            }}
          />
        ) : (instance.bannerUrl || instance.iconUrl) ? (
          <img
            loading="lazy"
            src={instance.bannerUrl || instance.iconUrl}
            alt={instance.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute top-2 right-2">
          <FavoriteButton type="instance" item={instance} pluginId={pluginId} size="sm" />
        </div>
      </div>

      {/* Header with avatar overlapping banner */}
      <CardHeader className="relative pt-0 pb-3">
        <div className="flex items-end gap-3 -mt-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-background bg-muted shadow-sm overflow-hidden">
            {instance.iconUrl ? (
              <Avatar>
                <AvatarImage className="h-10 w-10 object-cover" src={instance.iconUrl} />
                <AvatarFallback className="flex h-10 w-10 items-center justify-center text-sm font-medium">
                  {instance.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {instance.name.slice(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/plugins/$pluginId/instances/$instanceId/feed`}
              params={{ pluginId, instanceId: instance.apiId }}
              className="font-semibold text-base hover:underline truncate block"
            >
              {instance.name}
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Description */}
        {instance.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {instance.description}
          </p>
        )}

        {/* Stats */}
        {hasStats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {instance.usersCount != null && instance.usersCount > 0 && (
              <div className="flex items-center gap-1" title="Users">
                <UsersIcon className="size-3.5" />
                <span>{numberFormatter.format(instance.usersCount)}</span>
              </div>
            )}
            {instance.postsCount != null && instance.postsCount > 0 && (
              <div className="flex items-center gap-1" title="Posts">
                <MessageSquareTextIcon className="size-3.5" />
                <span>{numberFormatter.format(instance.postsCount)}</span>
              </div>
            )}
            {instance.commentsCount != null && instance.commentsCount > 0 && (
              <div className="flex items-center gap-1" title="Comments">
                <MessagesSquareIcon className="size-3.5" />
                <span>{numberFormatter.format(instance.commentsCount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "flex-1")}
            to={`/plugins/$pluginId/instances/$instanceId/feed`}
            params={{ pluginId, instanceId: instance.apiId }}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View Feed
          </Link>
          {hasCommunities && (
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
              to={`/plugins/$pluginId/instances/$instanceId/communities`}
              params={{ pluginId, instanceId: instance.apiId }}
            >
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Communities
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default InstanceCard;