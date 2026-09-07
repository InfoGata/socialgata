import React from "react";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  /** A tighter form, for somewhere a full card would be out of place. */
  compact: boolean;
  onShow: () => void;
  showLabel: string;
};

/**
 * What stands in for adult content the reader hasn't asked to see. Rendered
 * instead of the content, never over it — see useNsfwGate.
 */
const NsfwPlaceholder: React.FC<Props> = ({
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

export default NsfwPlaceholder;
