"use client";

import { useState } from "react";

type Props = {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
  show: boolean;
};

export function SearchHistory({ history, onSelect, onClear, show }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!show || history.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-lg md:rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-sm shadow-lg z-50 max-h-96 overflow-y-auto animate-scale-in duration-200">
      <div className="p-3 md:p-4 border-b border-white/5">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
          Recent searches
        </p>
        <div className="flex flex-wrap gap-2">
          {history.map((query, idx) => (
            <button
              key={`${query}-${idx}`}
              onClick={() => onSelect(query)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ animationDelay: `${idx * 30}ms` }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 md:py-1.5 text-xs transition active:scale-95 animate-scale-in duration-200 ${
                hoveredIndex === idx
                  ? "bg-white/10 text-white"
                  : "bg-white/5 text-zinc-300 hover:bg-white/8"
              }`}
            >
              <span>🕐</span>
              {query}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onClear}
        className="w-full px-4 py-2 md:py-3 text-xs text-zinc-500 hover:text-zinc-300 transition text-left hover:bg-white/5 active:bg-white/10"
      >
        Clear history
      </button>
    </div>
  );
}
