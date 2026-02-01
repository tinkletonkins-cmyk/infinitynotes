import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

export function SearchBar({ query, onQueryChange, resultCount, totalCount }: SearchBarProps) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-background border border-foreground">
      <Search size={16} className="opacity-50" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search notes..."
        className="bg-transparent border-none outline-none font-mono text-sm w-48 placeholder:opacity-50"
      />
      {query && (
        <>
          <span className="text-xs opacity-50 font-mono">
            {resultCount}/{totalCount}
          </span>
          <button
            onClick={() => onQueryChange('')}
            className="p-1 hover:opacity-70 transition-opacity"
            title="Clear search"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}
