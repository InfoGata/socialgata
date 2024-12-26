import { Instance } from "@/plugintypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Link } from "@tanstack/react-router";

interface InstanceCardProps {
  instance: Instance;
  pluginId: string;
}

const InstanceCard: React.FC<InstanceCardProps> = (props) => {
  const { instance, pluginId } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.instance.name}</CardTitle>
        <CardDescription>{props.instance.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={`/plugins/$pluginId/instances/$instanceId`} params={{pluginId, instanceId: instance.apiId}}>
          View
        </Link>
      </CardContent>
    </Card>
  )
}

export default InstanceCard;