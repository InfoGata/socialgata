import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsNavigationMenuOpen } from "@/store/reducers/uiSlice";
import { Link, useNavigate } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import React from "react";

export const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isNavigationMenuOpen = useAppSelector((state) => state.ui.isNavigationMenuOpen);
  
  const onToggleNavigationMenu = () => {
    dispatch(setIsNavigationMenuOpen(!isNavigationMenuOpen));
  };

  const handleSearch = (query: string) => {
    // For now, navigate to Reddit search - could be enhanced to support other plugins
    navigate({ 
      to: '/plugins/$pluginId/feed', 
      params: { pluginId: 'reddit' },
      search: { q: query } 
    });
  };

  return (
    <header className="fixed top-0 left-auto right-0 w-full shadow-lg z-40 bg-background border-b">
      <div className="flex items-center gap-4 px-6 min-h-12">
        <Button variant="ghost" size="icon" onClick={onToggleNavigationMenu}>
          <MenuIcon />
        </Button>
        <h1 className="text-xl font-bold">
          <Link to="/">SocialGata</Link>
        </h1>
        <SearchBar 
          onSearch={handleSearch}
          placeholder="Search Reddit..."
          className="max-w-md ml-auto"
        />
      </div>
    </header>
  );
};
