import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Inbox, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FavoriteButton } from '@/components/FavoriteButton';
import {
  useFavoriteInstances,
  useFavoritePosts,
  useFavoriteComments,
  useFavoriteCommunities,
  useFavoriteUsers
} from '@/sync/useFavorites';
import InstanceCard from '@/components/InstanceCard';
import PostComponent from '@/components/PostComponent';
import CommentComponent from '@/components/CommentComponent';
import { FullThreadLink } from '@/components/CommentPermalink';
import type { FavoriteComment } from '@/sync/favorites-repo';
import type { Community } from '@/plugintypes';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/favorites')({
  component: FavoritesPage
});

function FavoritesPage() {
  const instancesArray = useFavoriteInstances();
  const postsArray = useFavoritePosts();
  const commentsArray = useFavoriteComments();
  const communitiesArray = useFavoriteCommunities();
  const usersArray = useFavoriteUsers();

  const totalCount = instancesArray.length + postsArray.length + commentsArray.length + communitiesArray.length + usersArray.length;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-8 w-8 text-yellow-500" fill="currentColor" />
          <h1 className="text-3xl font-bold">Favorites</h1>
        </div>
        <p className="text-muted-foreground">
          Your favorited instances, communities, posts, comments, and users ({totalCount} total)
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="instances">
            Instances ({instancesArray.length})
          </TabsTrigger>
          <TabsTrigger value="communities">
            Communities ({communitiesArray.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            Users ({usersArray.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts ({postsArray.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({commentsArray.length})
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-6">
          {totalCount === 0 ? (
            <EmptyState message="You haven't favorited anything yet" />
          ) : (
            <>
              {instancesArray.length > 0 && (
                <Section title="Instances" count={instancesArray.length}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {instancesArray.map(({ key, pluginId, instance }) => (
                      <InstanceCard key={key} instance={instance} pluginId={pluginId} />
                    ))}
                  </div>
                </Section>
              )}

              {communitiesArray.length > 0 && (
                <Section title="Communities" count={communitiesArray.length}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communitiesArray.map(({ key, pluginId, community }) => (
                      <FavoriteCommunityCard key={key} pluginId={pluginId} community={community} />
                    ))}
                  </div>
                </Section>
              )}

              {usersArray.length > 0 && (
                <Section title="Users" count={usersArray.length}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {usersArray.map(({ key, pluginId, user }) => (
                      <Card key={key} className="hover:bg-accent transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to="/s/$pluginId/user/$apiId"
                              params={{ pluginId, apiId: user.apiId }}
                              className="block group flex-1 min-w-0"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={user.avatar} alt={user.name} />
                                  <AvatarFallback>
                                    <UserIcon className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <CardTitle className="group-hover:text-primary transition-colors">
                                  {user.name}
                                </CardTitle>
                              </div>
                            </Link>
                            <FavoriteButton
                              type="user"
                              item={user}
                              pluginId={pluginId}
                              size="sm"
                            />
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </Section>
              )}

              {postsArray.length > 0 && (
                <Section title="Posts" count={postsArray.length}>
                  <div className="space-y-4">
                    {postsArray.map(({ key, post }) => (
                      <PostComponent key={key} post={post} />
                    ))}
                  </div>
                </Section>
              )}

              {commentsArray.length > 0 && (
                <Section title="Comments" count={commentsArray.length}>
                  <div className="space-y-4">
                    {commentsArray.map(({ key, pluginId, comment }) => (
                      <FavoriteCommentCard key={key} pluginId={pluginId} comment={comment} />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances">
          {instancesArray.length === 0 ? (
            <EmptyState message="No favorited instances" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instancesArray.map(({ key, pluginId, instance }) => (
                <InstanceCard key={key} instance={instance} pluginId={pluginId} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Communities Tab */}
        <TabsContent value="communities">
          {communitiesArray.length === 0 ? (
            <EmptyState message="No favorited communities" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communitiesArray.map(({ key, pluginId, community }) => (
                <FavoriteCommunityCard key={key} pluginId={pluginId} community={community} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          {usersArray.length === 0 ? (
            <EmptyState message="No favorited users" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersArray.map(({ key, pluginId, user }) => (
                <Card key={key} className="hover:bg-accent transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/s/$pluginId/user/$apiId"
                        params={{ pluginId, apiId: user.apiId }}
                        className="block group flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              <UserIcon className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <CardTitle className="group-hover:text-primary transition-colors">
                            {user.name}
                          </CardTitle>
                        </div>
                      </Link>
                      <FavoriteButton
                        type="user"
                        item={user}
                        pluginId={pluginId}
                        size="sm"
                      />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          {postsArray.length === 0 ? (
            <EmptyState message="No favorited posts" />
          ) : (
            <div className="space-y-4">
              {postsArray.map(({ key, post }) => (
                <PostComponent key={key} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          {commentsArray.length === 0 ? (
            <EmptyState message="No favorited comments" />
          ) : (
            <div className="space-y-4">
              {commentsArray.map(({ key, pluginId, comment }) => (
                <FavoriteCommentCard key={key} pluginId={pluginId} comment={comment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * A favorited community. Communities from a plugin with instances keep their
 * instance in the link, since the same api id means a different community on
 * each instance.
 */
function FavoriteCommunityCard({ pluginId, community }: { pluginId: string; community: Community }) {
  const link = community.instanceId
    ? {
        to: '/s/$pluginId/i/$instanceId/c/$apiId',
        params: { pluginId, instanceId: community.instanceId, apiId: community.apiId },
      } as const
    : {
        to: '/s/$pluginId/c/$apiId',
        params: { pluginId, apiId: community.apiId },
      } as const;

  return (
    <Card className="hover:bg-accent transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link {...link} className="block group flex-1 min-w-0">
            <CardTitle className="group-hover:text-primary transition-colors">
              {community.name}
            </CardTitle>
            {community.description && (
              <CardDescription className="mt-2 line-clamp-3">
                {community.description}
              </CardDescription>
            )}
          </Link>
          <FavoriteButton
            type="community"
            item={community}
            pluginId={pluginId}
            size="sm"
          />
        </div>
      </CardHeader>
    </Card>
  );
}

/**
 * A favorited comment, headed by the post it came from. Comments favorited
 * before that post was recorded have no `source` and simply render without the
 * header — re-favoriting one from its post page fills it in.
 */
function FavoriteCommentCard({ pluginId, comment }: { pluginId: string; comment: FavoriteComment }) {
  const source = comment.source;
  const isImageboard = source?.platformType === 'imageboard';

  return (
    <div className="bg-card rounded-lg border p-4">
      {source?.postApiId && (
        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground border-b pb-2">
          <span>
            in{' '}
            <FullThreadLink
              context={source}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {source.postTitle || 'this post'}
            </FullThreadLink>
          </span>
          {comment.communityName && (
            <span className="text-xs">{comment.communityName}</span>
          )}
        </div>
      )}
      <CommentComponent
        comment={comment}
        platformType={source?.platformType || 'forum'}
        routePluginId={pluginId}
        permalinkContext={isImageboard ? undefined : source}
      />
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{count} {count === 1 ? 'item' : 'items'}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Click the star icon on instances, posts, or comments to add them here
        </p>
      </CardContent>
    </Card>
  );
}
