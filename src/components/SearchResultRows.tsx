import React from "react";
import { Link } from "@tanstack/react-router";
import { Users, User as UserIcon } from "lucide-react";
import { Community, User } from "@/plugintypes";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FavoriteButton } from "./FavoriteButton";
import NsfwGate from "./NsfwGate";
import NsfwBadge from "./NsfwBadge";

const compactNumber = Intl.NumberFormat("en", { notation: "compact" });

type RowProps = {
  icon?: string;
  fallback: React.ReactNode;
  title: React.ReactNode;
  meta?: string;
  description?: string;
  action: React.ReactNode;
};

/**
 * One line of a community or user search result. A list rather than the
 * communities page's card grid, so it sits in the same column as post results.
 */
const ResultRow: React.FC<RowProps> = ({ icon, fallback, title, meta, description, action }) => (
  <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-3 hover:bg-accent/40 transition-colors">
    <Avatar className="h-10 w-10 shrink-0">
      <AvatarImage src={icon} alt="" />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 min-w-0 font-semibold">{title}</div>
      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 wrap-break-word">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export const CommunityResultRow: React.FC<{ community: Community; pluginId: string }> = ({
  community,
  pluginId,
}) => (
  <NsfwGate nsfw={community.nsfw} community compact>
    <ResultRow
      icon={community.iconUrl}
      fallback={<Users className="h-5 w-5" />}
      title={
        <>
          <NsfwBadge show={community.nsfw} />
          {community.instanceId ? (
            <Link
              to="/s/$pluginId/i/$instanceId/c/$apiId"
              params={{ pluginId, instanceId: community.instanceId, apiId: community.apiId }}
              className="truncate hover:underline"
            >
              {community.name}
            </Link>
          ) : (
            <Link
              to="/s/$pluginId/c/$apiId"
              params={{ pluginId, apiId: community.apiId }}
              className="truncate hover:underline"
            >
              {community.name}
            </Link>
          )}
        </>
      }
      meta={
        community.memberCount !== undefined
          ? `${compactNumber.format(community.memberCount)} members`
          : undefined
      }
      description={community.description}
      action={
        <FavoriteButton type="community" item={community} pluginId={pluginId} size="sm" variant="icon" />
      }
    />
  </NsfwGate>
);

export const UserResultRow: React.FC<{ user: User; pluginId: string }> = ({ user, pluginId }) => {
  const meta = [
    user.handle && user.handle !== user.name ? `@${user.handle}` : undefined,
    user.karma !== undefined ? `${compactNumber.format(user.karma)} karma` : undefined,
    user.followerCount !== undefined
      ? `${compactNumber.format(user.followerCount)} followers`
      : undefined,
  ].filter(Boolean);

  return (
    <NsfwGate nsfw={user.nsfw} compact>
      <ResultRow
        icon={user.avatar}
        fallback={<UserIcon className="h-5 w-5" />}
        title={
          <>
            <NsfwBadge show={user.nsfw} />
            <Link
              to="/s/$pluginId/user/$apiId"
              params={{ pluginId, apiId: user.apiId }}
              className="truncate hover:underline"
            >
              {user.name}
            </Link>
          </>
        }
        meta={meta.length > 0 ? meta.join(" · ") : undefined}
        description={user.bio}
        action={<FavoriteButton type="user" item={user} pluginId={pluginId} size="sm" variant="icon" />}
      />
    </NsfwGate>
  );
};
