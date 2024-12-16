import NavigationLink from "./NavigationLink";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsNavigationMenuOpen } from "@/store/reducers/uiSlice";
import { NavigationLinkItem } from "@/types";
import { FaGear, FaHouse } from "react-icons/fa6";

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
      title: "Settings",
      link: { to: "/settings" },
      icon: <FaGear />
    }
  ]


  return (
    <Sheet open={isNavigationMenuOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-64 p-2 overflow-y-scroll">
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