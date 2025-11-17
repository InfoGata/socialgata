import { Instance } from "@/plugintypes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { MessageSquareTextIcon, UsersIcon, MessagesSquareIcon } from "lucide-react";
import { getService } from "@/services/selector-service";
import { Button } from "./ui/button";
import DOMPurify from "dompurify";
interface InstanceCardProps {
  instance: Instance;
  pluginId: string;
}

const InstanceCard: React.FC<InstanceCardProps> = (props) => {
  const { instance, pluginId } = props;
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  const service = getService(pluginId);
  const hasCommunities = service && service.getCommunities;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          {instance.iconUrl && (
            <Avatar>
              <AvatarImage className="size-10" src={instance.iconUrl} />
              <AvatarFallback>{instance.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          )}
          <CardTitle>
            <Link
              to={`/plugins/$pluginId/instances/$instanceId/feed`}
              params={{ pluginId, instanceId: instance.apiId }}
            >
              {props.instance.name}
            </Link>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {instance.bannerSvg ? (
          <div
            className="w-full h-48 bg-background flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(instance.bannerSvg),
            }}
          />
        ) : (
          <img
            loading="lazy"
            src={instance.bannerUrl || instance.iconUrl}
            alt={instance.name}
            className="w-full h-48 bg-background object-contain"
          />
        )}
        <CardDescription>{props.instance.description}</CardDescription>
      </CardContent>
      <CardFooter className="mt-auto flex-col gap-2">
        <div className="flex gap-2 justify-between items-center w-full">
          {instance.usersCount && (
            <div className="flex items-center gap-1">
              <UsersIcon className="size-4" />
              <span>{numberFormatter.format(instance.usersCount)}</span>
            </div>
          )}
          {instance.postsCount && (
            <div className="flex items-center gap-1">
              <MessageSquareTextIcon className="size-4" />
              <span>{numberFormatter.format(instance.postsCount)}</span>
            </div>
          )}
          {instance.commentsCount && (
            <div className="flex items-center gap-1">
              <MessagesSquareIcon className="size-4" />
              <span>{numberFormatter.format(instance.commentsCount)}</span>
            </div>
          )}
        </div>
        {hasCommunities && (
          <Button variant="outline" className="w-full" asChild>
            <Link
              to={`/plugins/$pluginId/instances/$instanceId/communities`}
              params={{ pluginId, instanceId: instance.apiId }}
            >
              Browse Communities
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default InstanceCard;