import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsNavigationMenuOpen } from "@/store/reducers/uiSlice";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import React from "react";
import { usePlugins } from "@/hooks/usePlugins";

interface SearchSource {
  pluginId: string;
  name: string;
}

/** The installed plugins that implement onSearch, in install order. */
const useSearchSources = (): SearchSource[] => {
  const { plugins } = usePlugins();
  const [searchSources, setSearchSources] = React.useState<SearchSource[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    const buildSearchSources = async () => {
      const searchable = await Promise.all(
        plugins.map(async (plugin) => {
          if (!plugin.id || !plugin.name) return undefined;
          const hasSearch = await plugin.hasDefined.onSearch();
          return hasSearch ? { pluginId: plugin.id, name: plugin.name } : undefined;
        })
      );

      // A later plugins change may have already resolved; don't clobber it.
      if (!cancelled) {
        setSearchSources(searchable.filter((s): s is SearchSource => s !== undefined));
      }
    };

    buildSearchSources();

    return () => {
      cancelled = true;
    };
  }, [plugins]);

  return searchSources;
};

export const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const isNavigationMenuOpen = useAppSelector((state) => state.ui.isNavigationMenuOpen);
  const searchSources = useSearchSources();

  const onToggleNavigationMenu = () => {
    dispatch(setIsNavigationMenuOpen(!isNavigationMenuOpen));
  };

  const pluginId = (params as Record<string, string | undefined>)?.pluginId;

  // Search follows whichever plugin the current route is on, falling back to
  // the first plugin that can search.
  const activeSource =
    searchSources.find((s) => s.pluginId === pluginId) ?? searchSources[0];

  const handleSearch = (query: string) => {
    if (!activeSource) return;
    navigate({
      to: '/s/$pluginId/feed',
      params: { pluginId: activeSource.pluginId },
      search: { q: query }
    });
  };

  return (
    <header className="fixed top-0 left-auto right-0 w-full shadow-lg z-40 bg-background border-b">
      <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-6 min-h-12">
        <Button variant="ghost" size="icon" onClick={onToggleNavigationMenu} className="shrink-0" aria-label="Open menu">
          <MenuIcon />
        </Button>
        <h1 className="text-xl font-bold hidden sm:block">
          <Link to="/">SocialGata</Link>
        </h1>
        {activeSource && (
          <SearchBar
            onSearch={handleSearch}
            placeholder={`Search ${activeSource.name}...`}
            className="flex-1 min-w-0 max-w-md ml-auto"
          />
        )}
      </div>
    </header>
  );
};
