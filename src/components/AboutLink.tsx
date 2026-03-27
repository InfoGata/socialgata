import { LinkRouterProps } from "@/types";
import { Link } from "@tanstack/react-router";
import React from "react";

export type AboutLinkProps = {
  icon?: React.JSX.Element;
  title: string;
  description?: string;
  url?: string;
  link?: LinkRouterProps;
  action?: () => void;
};

const AboutLinkContent: React.FC<{ icon?: React.JSX.Element; title: string; description?: string }> = ({ icon, description, title }) => (
  <div className="m-1 flex space-x-4 rounded-md py-2 pl-4 pr-16 transition-all hover:bg-accent hover:text-accent-foreground items-center">
    {icon && (
      <div className="size-10 flex items-center bg-muted-foreground rounded-full justify-center text-background">
        {icon}
      </div>
    )}
    <div className="space-y-1 w-full">
      <p className="text-sm font-medium leading-none">{title}</p>
      <p className="text-sm text-muted-foreground break-words">
        {description}
      </p>
    </div>
  </div>
);

const AboutLink: React.FC<AboutLinkProps> = ({ icon, description, title, url, action, link }) => {
  const content = <AboutLinkContent icon={icon} title={title} description={description} />;

  if (link) {
    return <Link {...link}>{content}</Link>;
  }
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }
  if (action) {
    return (
      <button className="w-full" onClick={action}>
        {content}
      </button>
    );
  }
  return content;
};

export default AboutLink;
