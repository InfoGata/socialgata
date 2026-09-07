import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  /** Seeds the input, e.g. from a query already in the URL. Remount (via `key`) to reseed. */
  initialQuery?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
  className,
  initialQuery,
}) => {
  const [query, setQuery] = useState(initialQuery ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-1 sm:gap-2 min-w-0", className)}>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0"
      />
      <Button type="submit" size="icon" variant="ghost" className="shrink-0" aria-label="Search">
        <SearchIcon className="size-4" />
      </Button>
    </form>
  );
};
