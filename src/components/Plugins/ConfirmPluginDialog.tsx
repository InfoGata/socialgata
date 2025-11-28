import React from "react";
import { useTranslation } from "react-i18next";
import { usePlugins } from "../../hooks/usePlugins";
import { PluginInfo } from "../../plugintypes";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ConfirmPluginDialogProps {
  open: boolean;
  setOpen?: (open: boolean) => void;
  plugins: PluginInfo[];
  handleClose: () => void;
  afterConfirm?: () => void;
  afterCancel?: () => void;
}

const ConfirmPluginDialog: React.FC<ConfirmPluginDialogProps> = (props) => {
  const {
    open,
    plugins,
    handleClose,
    afterConfirm,
    afterCancel,
    setOpen,
  } = props;
  const { addPlugin } = usePlugins();
  const { t } = useTranslation("plugins");
  const { t: tCommon } = useTranslation("common");

  const onConfirm = async () => {
    for (const plugin of plugins) {
      if (plugin) {
        await addPlugin(plugin);
      }
    }

    if (afterConfirm) {
      afterConfirm();
    }
    handleClose();
  };

  const info = plugins.map((p) => (
    <div className="flex flex-col gap-1" key={p.id}>
      <div className="font-semibold">
        {p.name} {p.version || ""}
      </div>
      {p.description && (
        <div className="text-sm text-muted-foreground">{p.description}</div>
      )}
    </div>
  ));

  const onCancel = () => {
    if (afterCancel) {
      afterCancel();
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("addPluginCount", { count: plugins.length })}
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="flex flex-col gap-2">{info}</div>
          {plugins.length === 1 && plugins[0].manifestUrl && (
            <div className="mt-2 text-sm">
              {t("updateManifestUrl")}:{" "}
              <a
                href={plugins[0].manifestUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                {plugins[0].manifestUrl}
              </a>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {tCommon("cancel")}
          </Button>
          <Button variant="outline" onClick={onConfirm}>
            {tCommon("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmPluginDialog;
