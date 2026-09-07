import React from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";
import NsfwPlaceholder from "@/components/NsfwPlaceholder";

export type GateOptions = {
  /** A tighter placeholder, for somewhere a full card would be out of place. */
  compact?: boolean;
  /** Wording for a whole community rather than a single item. */
  community?: boolean;
};

export type GateResult = {
  /** True when the caller must render `placeholder` instead of its content. */
  withheld: boolean;
  /** Null under "hide", which withholds the item without leaving a trace. */
  placeholder: React.ReactNode;
};

/**
 * Withholds adult content until the reader asks for it.
 *
 * This is the backstop rather than the whole mechanism. A plugin that honors
 * the preference can decline to request adult content from the source, which is
 * better in every way — but a plugin can be third-party, out of date, or simply
 * buggy, and this layer holds regardless because it needs nothing from the
 * plugin except the flag.
 *
 * Callers render the placeholder *instead of* their content, never over it.
 * Covering something already in the DOM means the browser has fetched the image
 * and cached it: the content reached the device and touched the network, which
 * is most of what withholding it was for.
 *
 * Most callers want the NsfwGate component instead. This exists for the ones
 * with more than one layout branch, where returning early beats wrapping each.
 *
 * Lives apart from NsfwGate and NsfwPlaceholder because a module that mixes a
 * hook with a component loses fast refresh for everything in it.
 */
export const useNsfwGate = (
  nsfw?: boolean,
  { compact = false, community = false }: GateOptions = {}
): GateResult => {
  const nsfwDisplay = useAppSelector((state) => state.ui.nsfwDisplay);
  const [revealed, setRevealed] = React.useState(false);
  const { t } = useTranslation("nsfw");

  if (!nsfw || nsfwDisplay === "show" || revealed) {
    return { withheld: false, placeholder: null };
  }

  if (nsfwDisplay === "hide") {
    return { withheld: true, placeholder: null };
  }

  return {
    withheld: true,
    placeholder: (
      <NsfwPlaceholder
        title={t(community ? "communityHiddenTitle" : "hiddenTitle")}
        description={t(
          community ? "communityHiddenDescription" : "hiddenDescription"
        )}
        compact={compact}
        onShow={() => setRevealed(true)}
        showLabel={t("show")}
      />
    ),
  };
};
