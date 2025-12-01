import { Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { buttonVariants } from "./ui/button";
import { usePlugins } from "@/hooks/usePlugins";

type Props = {
  pluginId: string;
};

const LogginedIn: React.FC<Props> = (props) => {
  const [hasInstances, setHasInstances] = useState(false);
  const { pluginId } = props;
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
