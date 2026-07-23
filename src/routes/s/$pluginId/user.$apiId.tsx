import PostComponent from "@/components/PostComponent";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePlugins } from "@/hooks/usePlugins";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarDays,
  Link as LinkIcon,
  MapPin,
  User as UserIcon,
} from "lucide-react";
import React from "react";
import {
  canonicalizePluginUrl,
  pluginIdParams,
  pluginNotFoundComponent,
} from "@/lib/plugin-route";

const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });

type StatProps = {
  label: string;
  value?: number;
};

const Stat: React.FC<StatProps> = ({ label, value }) => {
  if (value === undefined) return null;
  return (
    <div className="flex items-baseline gap-1">
      <span className="font-semibold text-foreground">
        {numberFormatter.format(value)}
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
};

const UserOverview: React.FC = () => {
  const { user, items } = Route.useLoaderData();
  const { pluginId } = Route.useParams();
  const { plugins } = usePlugins();
  const plugin = plugins.find((p) => p.id === pluginId);
  const platformType = plugin?.platformType || "forum";

  const handle = user?.handle || user?.apiId;
  const websiteHref =
    user?.website && !/^https?:\/\//i.test(user.website)
      ? `https://${user.website}`
      : user?.website;
  const websiteLabel = user?.website?.replace(/^https?:\/\//i, "");

  const hasStats =
    user &&
    (user.tweetCount !== undefined ||
      user.followingCount !== undefined ||
      user.followerCount !== undefined ||
      user.likeCount !== undefined);

  return (
    <div className="space-y-4">
      {user && (
        <div className="bg-card rounded-xl border overflow-hidden">
          {/* Banner */}
          <div className="relative h-32 w-full bg-linear-to-r from-primary/20 to-primary/5 sm:h-44">
            {user.banner && (
              <img
                src={user.banner}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Avatar + actions row */}
            <div className="flex items-end justify-between">
              <Avatar className="-mt-12 h-24 w-24 border-4 border-card sm:-mt-14 sm:h-28 sm:w-28">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  <UserIcon className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="pt-3">
                <FavoriteButton
                  type="user"
                  item={user}
                  pluginId={pluginId}
                  size="lg"
                  variant="button"
                />
              </div>
            </div>

            {/* Name + handle */}
            <div className="mt-3">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold sm:text-2xl">{user.name}</h1>
                {user.verified && (
                  <BadgeCheck
                    className="h-5 w-5 shrink-0 text-primary"
                    aria-label="Verified"
                  />
                )}
              </div>
              {handle && (
                <p className="text-muted-foreground text-sm">@{handle}</p>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm">
                {user.bio}
              </p>
            )}

            {/* Meta row */}
            {(user.location || user.website || user.joinedDate) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {websiteLabel}
                  </a>
                )}
                {user.joinedDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Joined {user.joinedDate}
                  </span>
                )}
              </div>
            )}

            {/* Stats */}
            {hasStats && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                <Stat label="Posts" value={user.tweetCount} />
                <Stat label="Following" value={user.followingCount} />
                <Stat label="Followers" value={user.followerCount} />
                <Stat label="Likes" value={user.likeCount} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((d) => (
          <PostComponent key={d.apiId} post={d} platformType={platformType} />
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/s/$pluginId/user/$apiId")({
  params: pluginIdParams<{ apiId: string }>(),
  beforeLoad: canonicalizePluginUrl,
  notFoundComponent: pluginNotFoundComponent,
  component: UserOverview,
  loader: async ({ params, context }) => {
    const plugin = context.plugins.find((p) => p.id === params.pluginId);
    if (plugin) {
      if (await plugin.hasDefined.onGetUser()) {
        const response = await plugin.remote.onGetUser({ apiId: params.apiId });
        return { user: response.user, items: response.items };
      } else {
        return { user: undefined, items: [] };
      }
    } else {
      throw notFound();
    }
  },
});
