import { Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { buttonVariants } from "./ui/button";
import { getService } from "@/services/selector-service";

type Props = {
  pluginId: string;
};

const LogginedIn: React.FC<Props> = (props) => {
  const [hasInstances, setHasInstances] = useState(false);
  const { pluginId } = props;
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
  return (
    <div className="flex gap-2">
      <Link
        className={buttonVariants({ variant: "default" })}
        to="/plugins/$pluginId/feed"
        params={{ pluginId: pluginId }}
      >
        Feed
      </Link>
      {hasInstances && (
        <Link
          className={buttonVariants({ variant: "default" })}
          to="/plugins/$pluginId/instances"
          params={{ pluginId: pluginId }}
        >
          Instances
        </Link>
      )}
    </div>
  );
};

export default LogginedIn;
