import { useTranslation } from "react-i18next";
import { PluginInfo } from "@/plugintypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmUpdatePluginDialogProps {
  open: boolean;
  plugin: PluginInfo | null;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmUpdatePluginDialog: React.FC<ConfirmUpdatePluginDialogProps> = ({
  open,
  plugin,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation("plugins");
  const { t: tCommon } = useTranslation("common");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("updatePluginTitle")}</DialogTitle>
          <DialogDescription>
            {t("confirmUpdatePlugin")}
          </DialogDescription>
        </DialogHeader>
        {plugin?.name && (
          <p className="text-sm text-muted-foreground">{plugin.name}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={onConfirm}>{t("updatePlugin")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmUpdatePluginDialog;
