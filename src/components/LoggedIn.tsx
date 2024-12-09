import { Link } from "@tanstack/react-router";
import React from "react";
import { buttonVariants } from "./ui/button";

type Props = {
  pluginId: string;
};

const LogginedIn: React.FC<Props> = (props) => {
  const { pluginId } = props;
  return (
    <div>
      <Link
        className={buttonVariants({ variant: "default" })}
        to="/plugins/$pluginId/feed"
        params={{ pluginId: pluginId }}
      >
        Feed
      </Link>
    </div>
  );
};

export default LogginedIn;
