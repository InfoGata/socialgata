import { Instance } from "@/plugintypes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { MessageSquareTextIcon, UsersIcon, MessagesSquareIcon } from "lucide-react"
interface InstanceCardProps {
  instance: Instance;
  pluginId: string;
}

const InstanceCard: React.FC<InstanceCardProps> = (props) => {
  const { instance, pluginId } = props;
  const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage className="w-10 h-10" src={instance.iconUrl} />
            <AvatarFallback>{instance.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
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
        <img
          src={instance.bannerUrl}
          alt={instance.name}
          className="w-full h-48 bg-background object-cover"
        />
        <CardDescription>{props.instance.description}</CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <div className="flex gap-2 justify-between items-center w-full">
          {instance.usersCount && <div className="flex items-center gap-1">
            <UsersIcon className="w-4 h-4" />
            <span>{numberFormatter.format(instance.usersCount)}</span>
          </div>}
          {instance.postsCount && <div className="flex items-center gap-1">
            <MessageSquareTextIcon className="w-4 h-4" />
            <span>{numberFormatter.format(instance.postsCount)}</span>
          </div>}
          {instance.commentsCount && <div className="flex items-center gap-1">
            <MessagesSquareIcon className="w-4 h-4" />
            <span>{numberFormatter.format(instance.commentsCount)}</span>
          </div>}
        </div>
      </CardFooter>
    </Card>
  );
}

export default InstanceCard;