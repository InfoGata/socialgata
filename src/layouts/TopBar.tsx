import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsNavigationMenuOpen } from "@/store/reducers/uiSlice";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import React, { useState } from "react";
import { usePlugins } from "@/hooks/usePlugins";

export const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const isNavigationMenuOpen = useAppSelector((state) => state.ui.isNavigationMenuOpen);
  const { plugins } = usePlugins();

  const [searchSources, setSearchSources] = React.useState<Array<{
    id: string;
    name: string;
    pluginId: string;
  }>>([]);

  // Build search sources from dynamic plugins that have onSearch defined
  React.useEffect(() => {
    const buildSearchSources = async () => {
      const sources: Array<{ id: string; name: string; pluginId: string }> = [];

      for (const plugin of plugins) {
        if (plugin.id && plugin.name) {
          const hasSearch = await plugin.hasDefined.onSearch();
          if (hasSearch) {
            sources.push({
              id: plugin.id,
              name: plugin.name,
              pluginId: plugin.id
            });
          }
        }
      }

      setSearchSources(sources);
    };

    buildSearchSources();
  }, [plugins]);

  const [selectedSearchSource, setSelectedSearchSource] = useState<string>("");

  const onToggleNavigationMenu = () => {
    dispatch(setIsNavigationMenuOpen(!isNavigationMenuOpen));
  };

  const pluginId = (params as Record<string, string | undefined>)?.pluginId;

  // Compute effective search source: prefer pluginId match, then user selection, then first source
  const effectiveSearchSource = React.useMemo(() => {
    if (searchSources.length === 0) return "";
    if (pluginId) {
      const source = searchSources.find(s => s.pluginId === pluginId);
      if (source) return source.id;
    }
    if (selectedSearchSource && searchSources.find(s => s.id === selectedSearchSource)) {
      return selectedSearchSource;
    }
    return searchSources[0].id;
  }, [searchSources, selectedSearchSource, pluginId]);

  const handleSearch = (query: string) => {
    const selectedSource = searchSources.find(source => source.id === effectiveSearchSource);
    if (selectedSource) {
      navigate({
        to: '/plugins/$pluginId/feed',
        params: { pluginId: selectedSource.pluginId },
        search: { q: query }
      });
    }
  };

  return (
    <header className="fixed top-0 left-auto right-0 w-full shadow-lg z-40 bg-background border-b">
      <div className="flex items-center gap-4 px-6 min-h-12">
        <Button variant="ghost" size="icon" onClick={onToggleNavigationMenu}>
          <MenuIcon />
        </Button>
        <h1 className="text-xl font-bold hidden sm:block">
          <Link to="/">SocialGata</Link>
        </h1>
        {searchSources.length > 0 && (
          <div className="flex items-center gap-2 max-w-md ml-auto">
            <Select
              value={effectiveSearchSource}
              onValueChange={(value) => setSelectedSearchSource(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SearchBar
              onSearch={handleSearch}
              placeholder={`Search ${searchSources.find(source => source.id === effectiveSearchSource)?.name ?? ""}...`}
              className="flex-1"
            />
          </div>
        )}
      </div>
    </header>
  );
};
