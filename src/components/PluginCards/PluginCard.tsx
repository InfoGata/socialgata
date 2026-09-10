import { PluginDescription } from "@/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { KeyRound, Plus } from "lucide-react";

type Props = {
  plugin: PluginDescription;
  addPlugin: (description: PluginDescription) => Promise<void>;
  /**
   * This host can't make the plugin's anonymous requests, so the plugin only
   * works once an account is connected. Said on the card rather than left to be
   * discovered as an error page on the first feed.
   */
  needsSignIn?: boolean;
};

const PluginCard = (props: Props) => {
  const { plugin, addPlugin, needsSignIn } = props;
  const onClickAdd = () => {
    addPlugin(plugin);
  };
  const { t } = useTranslation("plugins");

  return (
    <Card className="flex flex-col justify-between transition-colors hover:border-primary/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{plugin.name}</CardTitle>
        {plugin.description && (
          <CardDescription className="text-sm mt-1">
            {plugin.description}
          </CardDescription>
        )}
        {needsSignIn && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t("signInRequiredWithoutExtension")}</span>
          </p>
        )}
      </CardHeader>
      <div className="px-6 pb-4">
        <Button size="sm" onClick={onClickAdd} className="w-full">
          <Plus className="h-4 w-4 mr-1.5" />
          {t("addPlugin")}
        </Button>
      </div>
    </Card>
  );
};

export default PluginCard;
