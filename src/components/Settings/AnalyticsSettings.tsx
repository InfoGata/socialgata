import { useTranslation } from "react-i18next";
import { ChartNoAxesColumn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAnalyticsEnabled } from "@/store/reducers/uiSlice";
import { analyticsConfigured, doNotTrackEnabled } from "@/lib/analytics";

const AnalyticsSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const analyticsEnabled = useAppSelector((state) => state.ui.analyticsEnabled);
  const { t } = useTranslation("analytics");

  // Nothing to offer a switch for in a build with no key.
  if (!analyticsConfigured) return null;

  const doNotTrack = doNotTrackEnabled();

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <ChartNoAxesColumn className="h-5 w-5" />
        <h2 className="text-xl font-semibold">{t("title")}</h2>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          {doNotTrack && (
            <p className="text-sm font-medium">{t("doNotTrackTitle")}</p>
          )}
          {doNotTrack && (
            <p className="text-sm text-muted-foreground">
              {t("doNotTrackDescription")}
            </p>
          )}
          <Link to="/privacy" className="inline-block text-sm text-primary hover:underline">
            {t("privacyLink")}
          </Link>
        </div>
        <Button
          variant={analyticsEnabled && !doNotTrack ? "default" : "outline"}
          size="sm"
          // Left interactive under Do Not Track so the choice is still
          // recorded, but the label tells the truth about what's happening.
          onClick={() => dispatch(setAnalyticsEnabled(!analyticsEnabled))}
        >
          {analyticsEnabled && !doNotTrack ? t("enabled") : t("disabled")}
        </Button>
      </div>
    </div>
  );
};

export default AnalyticsSettings;
