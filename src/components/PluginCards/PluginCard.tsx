import { PluginDescription } from "@/types";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

type Props = {
  plugin: PluginDescription;
  addPlugin: (description: PluginDescription) => Promise<void>;
};

const PluginCard = (props: Props) => {
  const { plugin, addPlugin } = props;
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
