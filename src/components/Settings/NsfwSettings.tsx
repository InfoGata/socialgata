import { useTranslation } from "react-i18next";
import { EyeOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setNsfwDisplay, type NsfwDisplay } from "@/store/reducers/uiSlice";

const NsfwSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const nsfwDisplay = useAppSelector((state) => state.ui.nsfwDisplay);
  const { t } = useTranslation("nsfw");

  const options: { value: NsfwDisplay; label: string; description: string }[] = [
    {
      value: "warn",
      label: t("optionWarn"),
      description: t("optionWarnDescription"),
    },
    {
      value: "hide",
      label: t("optionHide"),
      description: t("optionHideDescription"),
    },
    {
      value: "show",
      label: t("optionShow"),
      description: t("optionShowDescription"),
    },
  ];

  const selected = options.find((o) => o.value === nsfwDisplay);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <EyeOff className="h-5 w-5" />
        <h2 className="text-xl font-semibold">{t("settingsTitle")}</h2>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">
            {t("settingsDescription")}
          </p>
          {selected && (
            <p className="text-sm text-muted-foreground">
              {selected.description}
            </p>
          )}
        </div>
        <Select
          value={nsfwDisplay}
          onValueChange={(value) => dispatch(setNsfwDisplay(value as NsfwDisplay))}
        >
          <SelectTrigger className="w-[200px]" data-testid="nsfw-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default NsfwSettings;
