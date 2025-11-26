import { useTheme, Theme } from "@infogata/shadcn-vite-theme-provider";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const ThemeChangeSettings: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation("settings");

  const onThemeChange = (value: string) => {
    theme.setTheme(value as Theme);
  };

  return (
    <div>
      <Select value={theme.theme} onValueChange={onThemeChange}>
        <SelectTrigger className="w-[180px]" data-testid="theme-select">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">{t("light")}</SelectItem>
          <SelectItem value="dark">{t("dark")}</SelectItem>
          <SelectItem value="system">{t("system")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export default ThemeChangeSettings;