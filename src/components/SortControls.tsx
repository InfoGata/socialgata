import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { SortOption } from "@/plugintypes";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type SortControlsProps = {
  sortOptions?: SortOption[];
  sortId?: string;
  timeRangeId?: string;
  /** Extra classes for the wrapper, for callers with their own spacing. */
  className?: string;
};

/**
 * Sort + optional time-range dropdowns for any sortable listing — feeds,
 * communities, user pages, and a post's comments. Renders nothing when the
 * plugin declares no sort options. Selections are written to the current
 * route's search params so they survive reloads and pagination; `page` is
 * cleared on change since cursors are sort-specific.
 */
const SortControls: React.FC<SortControlsProps> = (props) => {
  const { sortOptions, sortId, timeRangeId, className } = props;
  const navigate = useNavigate();

  if (!sortOptions || sortOptions.length === 0) return null;

  const activeSort =
    sortOptions.find((s) => s.id === sortId) ?? sortOptions[0];
  const timeRanges = activeSort.timeRanges;
  const activeTimeRangeId =
    timeRangeId ?? activeSort.defaultTimeRangeId ?? timeRanges?.[0]?.id;

  const onSortChange = (value: string) => {
    const next = sortOptions.find((s) => s.id === value);
    const nextTimeRangeId = next?.timeRanges
      ? next.defaultTimeRangeId ?? next.timeRanges[0]?.id
      : undefined;
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        sortId: value,
        timeRangeId: nextTimeRangeId,
        page: undefined,
      }),
    });
  };

  const onTimeRangeChange = (value: string) => {
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        timeRangeId: value,
        page: undefined,
      }),
    });
  };

  return (
    <div className={cn("flex items-center gap-2 mb-4", className)}>
      <Select value={activeSort.id} onValueChange={onSortChange}>
        <SelectTrigger className="h-8 w-auto min-w-32 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {timeRanges && timeRanges.length > 0 && (
        <Select
          value={activeTimeRangeId}
          onValueChange={onTimeRangeChange}
        >
          <SelectTrigger className="h-8 w-auto min-w-28 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.id} value={range.id}>
                {range.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default SortControls;
