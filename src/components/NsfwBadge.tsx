import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Marks a community as adult where its name is shown. Separate from NsfwGate:
 * the gate decides whether something is rendered at all, while this labels
 * what is already on screen — including once the reader has chosen to reveal
 * it, and under the "always show" preference where nothing is gated.
 */
const NsfwBadge: React.FC<{ show?: boolean }> = ({ show }) => {
  const { t } = useTranslation("nsfw");
  if (!show) return null;
  return (
    <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">
      {t("badge")}
    </span>
  );
};

export default NsfwBadge;
