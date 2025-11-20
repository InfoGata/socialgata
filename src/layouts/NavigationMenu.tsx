import NavigationLink from "./NavigationLink";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsNavigationMenuOpen } from "@/store/reducers/uiSlice";
import { NavigationLinkItem } from "@/types";
import { FaGear, FaHouse } from "react-icons/fa6";
import { Star } from "lucide-react";

const NavigationMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const isNavigationMenuOpen = useAppSelector((state) => state.ui.isNavigationMenuOpen);
  const setOpen = (open: boolean) => {
    dispatch(setIsNavigationMenuOpen(open));
  };

  const linkItems: NavigationLinkItem[] = [
    {
      title: "Home",
      link: { to: "/" },
      icon: <FaHouse />
    },
    {
      title: "Favorites",
      link: { to: "/favorites" },
      icon: <Star size={16} />,
    },
    {
      title: "Settings",
      link: { to: "/settings" },
      icon: <FaGear />
    }
  ]

  return (
    <Sheet open={isNavigationMenuOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-64 p-2 overflow-y-scroll">
        <SheetHeader>
          <VisuallyHidden.Root>
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Menu</SheetDescription>
          </VisuallyHidden.Root>
        </SheetHeader>
        <div className="space-y-2 py-4 text-muted-foreground">
          {linkItems.map((item) => (
            <NavigationLink key={item.title} item={item} setOpen={setOpen} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationMenu;