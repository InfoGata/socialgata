import React from "react";
import { useTranslation } from "react-i18next";
import { EyeOff } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlaceholderProps = {
  title: string;
  description?: string;
  compact: boolean;
  onShow: () => void;
  showLabel: string;
};

const Placeholder: React.FC<PlaceholderProps> = ({
  title,
  description,
  compact,
  onShow,
  showLabel,
}) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-lg border border-dashed bg-muted/30",
      compact ? "px-3 py-2" : "px-4 py-6"
    )}
  >
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <EyeOff className="size-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{title}</p>
      {!compact && description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    <Button variant="outline" size="sm" className="shrink-0" onClick={onShow}>
      {showLabel}
    </Button>
  </div>
);

type GateOptions = {
  /** A tighter placeholder, for somewhere a full card would be out of place. */
  compact?: boolean;
  /** Wording for a whole community rather than a single item. */
  community?: boolean;
};

type GateResult = {
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
 * The hook exists for callers with more than one layout branch, where wrapping
 * each one would be worse than returning early. Prefer the component.
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
      <Placeholder
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

type Props = GateOptions & {
  /**
   * Whether the thing being wrapped is adult content. Callers OR the item's own
   * flag with its community's, since some sources only classify the community.
   */
  nsfw?: boolean;
  children: React.ReactNode;
};

const NsfwGate: React.FC<Props> = ({ nsfw, children, ...options }) => {
  const { withheld, placeholder } = useNsfwGate(nsfw, options);
  return <>{withheld ? placeholder : children}</>;
};

export default NsfwGate;
