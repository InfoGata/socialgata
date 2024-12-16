import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsNavigationMenuOpen } from "@/store/reducers/uiSlice";
import { Link } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import React from "react";

export const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const isNavigationMenuOpen = useAppSelector((state) => state.ui.isNavigationMenuOpen);
  const onToggleNavigationMenu = () => {
    dispatch(setIsNavigationMenuOpen(!isNavigationMenuOpen));
  };
  return (
    <header className="fixed top-0 left-auto right-0 w-full shadow-lg z-40 bg-background border-b">
      <div className="flex items-center px-6 min-h-12">
        <Button variant="ghost" size="icon" onClick={onToggleNavigationMenu}>
          <MenuIcon />
        </Button>
        <h1 className="text-xl font-bold">
          <Link to="/">SocialGata</Link>
        </h1>
      </div>
    </header>
  );
};
