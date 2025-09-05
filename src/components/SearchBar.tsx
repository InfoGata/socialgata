import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search...", 
  className 
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button type="submit" size="icon" variant="ghost">
        <SearchIcon className="size-4" />
      </Button>
    </form>
  );
};