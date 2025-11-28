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
import React, { useState, useEffect } from "react";
import { builtinPlugins } from "@/builtin-plugins";
import { getService } from "@/services/selector-service";

export const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const isNavigationMenuOpen = useAppSelector((state) => state.ui.isNavigationMenuOpen);

  const searchSources = React.useMemo(() => {
    return builtinPlugins
      .map(plugin => {
        const service = getService(plugin.id);
        if (service && service.search) {
          return {
            id: plugin.id,
            name: plugin.name,
            pluginId: plugin.id
          };
        }
        return null;
      })
      .filter((source): source is NonNullable<typeof source> => source !== null);
  }, []);

  const [selectedSearchSource, setSelectedSearchSource] = useState<string>(
    searchSources[0]?.id || 'reddit'
  );

  const onToggleNavigationMenu = () => {
    dispatch(setIsNavigationMenuOpen(!isNavigationMenuOpen));
  };

  const pluginId = (params as Record<string, string | undefined>)?.pluginId;
  
  useEffect(() => {
    if (pluginId) {
      const source = searchSources.find(s => s.pluginId === pluginId);
      if (source) {
        setSelectedSearchSource(source.id);
      }
    }
  }, [pluginId, searchSources]);

  const handleSearch = (query: string) => {
    const selectedSource = searchSources.find(source => source.id === selectedSearchSource);
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
        <div className="flex items-center gap-2 max-w-md ml-auto">
          <Select
            value={selectedSearchSource}
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
            placeholder={`Search ${searchSources.find(source => source.id === selectedSearchSource)?.name}...`}
            className="flex-1"
          />
        </div>
      </div>
    </header>
  );
};
