import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useIsFavoriteInstance,
  useIsFavoritePost,
  useIsFavoriteComment,
  useIsFavoriteCommunity,
  useFavoritesMutations
} from '@/sync/useFavorites';
import type { Instance, Post, Community } from '@/plugintypes';
import { cn } from '@/lib/utils';

type FavoriteType = 'instance' | 'post' | 'comment' | 'community';

interface FavoriteButtonProps {
  type: FavoriteType;
  item: Instance | Post | Community;
  pluginId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

/**
 * FavoriteButton component for adding/removing favorites
 * Works with instances, posts, comments, and communities
 * Uses automerge-repo hooks directly (no Redux)
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  type,
  item,
  pluginId,
  size = 'md',
  variant = 'icon',
  className
}) => {
  const mutations = useFavoritesMutations();

  // Get the item ID based on type
  const itemId = 'apiId' in item ? item.apiId : '';

  // Check if item is favorited using hooks
  const isFavoriteInstance = useIsFavoriteInstance(pluginId, itemId || '');
  const isFavoritePost = useIsFavoritePost(pluginId, itemId || '');
  const isFavoriteComment = useIsFavoriteComment(pluginId, itemId || '');
  const isFavoriteCommunity = useIsFavoriteCommunity(pluginId, itemId || '');

  const isFavorite = type === 'instance' ? isFavoriteInstance
    : type === 'post' ? isFavoritePost
    : type === 'comment' ? isFavoriteComment
    : isFavoriteCommunity;

  // Handle toggle - directly mutate via automerge-repo
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!itemId) return;

    switch (type) {
      case 'instance':
        mutations.toggleInstance(pluginId, itemId, item as Instance);
        break;
      case 'post':
        mutations.togglePost(pluginId, itemId, item as Post);
        break;
      case 'comment':
        mutations.toggleComment(pluginId, itemId, item as Post);
        break;
      case 'community':
        mutations.toggleCommunity(pluginId, itemId, item as Community);
        break;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };

  // Tooltip text
  const tooltipText = isFavorite ? 'Remove from favorites' : 'Add to favorites';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {variant === 'icon' ? (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFavorite && 'text-yellow-500 hover:text-yellow-600',
                !isFavorite && 'text-muted-foreground hover:text-yellow-500',
                className
              )}
              onClick={handleToggle}
              aria-label={tooltipText}
            >
              <Star
                size={iconSizes[size]}
                fill={isFavorite ? 'currentColor' : 'none'}
                className="transition-all"
              />
            </Button>
          ) : (
            <Button
              variant="outline"
              size={size === 'md' ? 'default' : size}
              className={cn(
                'gap-2',
                isFavorite && 'text-yellow-500 border-yellow-500/50',
                className
              )}
              onClick={handleToggle}
            >
              <Star
                size={iconSizes[size]}
                fill={isFavorite ? 'currentColor' : 'none'}
              />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
