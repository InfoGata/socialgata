import Alert from "@/components/Alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePluginLogin } from "@/hooks/usePluginLogin";
import {
  LogIn,
  LogOut,
  MoreHorizontalIcon,
  Settings,
  Rss,
  MessageSquare,
  Image,
  Puzzle,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { FaTrash } from "react-icons/fa6";
import { PluginFrameContainer } from "../../contexts/PluginsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Link } from "@tanstack/react-router";

interface PluginContainerProps {
  plugin: PluginFrameContainer;
  deletePlugin: (plugin: PluginFrameContainer) => Promise<void>;
}

const platformConfig = {
  forum: {
    label: "Forum",
    icon: MessageSquare,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  microblog: {
    label: "Microblog",
    icon: Rss,
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  imageboard: {
    label: "Imageboard",
    icon: Image,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
} as const;

const PluginContainer: React.FC<PluginContainerProps> = (props) => {
  const { plugin, deletePlugin } = props;
  const [alertOpen, setAlertOpen] = React.useState(false);
  const { t } = useTranslation("plugins");
  const { hasLogin, isLoggedIn, login, logout } = usePluginLogin(plugin);

  const onDelete = async () => {
    setAlertOpen(true);
  };

  const confirmDelete = async () => {
    await deletePlugin(plugin);
  };

  const platform = plugin.platformType
    ? platformConfig[plugin.platformType]
    : null;
  const PlatformIcon = platform?.icon ?? Puzzle;

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <PlatformIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <Link
                to="/plugins/$pluginId"
                params={{ pluginId: plugin.id || "" }}
                className="font-semibold text-base hover:underline truncate block"
              >
                {plugin.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                {plugin.version && (
                  <span className="text-xs text-muted-foreground">
                    v{plugin.version}
                  </span>
                )}
                {platform && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      platform.className
                    )}
                  >
                    {platform.label}
                  </span>
                )}
                {hasLogin && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      isLoggedIn
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {isLoggedIn ? "Connected" : "Not connected"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">{t("openMenu")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {plugin.hasOptions && (
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link
                    to="/plugins/$pluginId/options"
                    params={{ pluginId: plugin.id || "" }}
                  >
                    <Settings />
                    <span>{t("options")}</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {hasLogin &&
                (isLoggedIn ? (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={logout}
                  >
                    <LogOut />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => login()}
                  >
                    <LogIn />
                    <span>{t("login")}</span>
                  </DropdownMenuItem>
                ))}
              <DropdownMenuItem className="cursor-pointer" onClick={onDelete}>
                <FaTrash />
                <span>{t("deletePlugin")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <Alert
        title={t("deletePlugin")}
        description={t("confirmDelete")}
        setOpen={setAlertOpen}
        open={alertOpen}
        confirm={confirmDelete}
      />
    </Card>
  );
};

export default PluginContainer;
