"use client";

import Image from "next/image";
import type { YoutubeSearchItem } from "@/lib/types";

type Props = {
  items: YoutubeSearchItem[];
  activeId: string | null;
  onSelect: (item: YoutubeSearchItem) => void;
  loading?: boolean;
};

export function VideoResults({
  items,
  activeId,
  onSelect,
  loading,
}: Props) {
  if (loading) {
    return (
      <ul className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-lg md:rounded-xl border border-white/5 bg-zinc-900/40"
          >
            <div className="relative aspect-video w-full bg-zinc-800/60 animate-pulse" />
            <div className="p-2 md:p-3 space-y-2">
              <div className="h-4 bg-zinc-800/60 rounded animate-pulse" />
              <div className="h-3 bg-zinc-800/60 rounded w-3/4 animate-pulse hidden md:block" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg md:rounded-xl border border-white/5 bg-zinc-900/30 px-4 py-8 text-center text-sm text-zinc-500">
        No results yet. Try a search or a topic chip.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, idx) => {
        const active = item.id === activeId;
        return (
          <li key={item.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`group w-full overflow-hidden rounded-lg md:rounded-xl border text-left transition-all active:scale-95 ${
                active
                  ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/40 scale-105 md:scale-100"
                  : "border-white/10 hover:border-white/20 hover:scale-102 active:opacity-80"
              } bg-zinc-900/40 min-h-max touch-manipulation`}
            >
              <div className="relative aspect-video w-full bg-zinc-800 overflow-hidden">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-all duration-300 group-hover:opacity-90 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : null}
              </div>
              <div className="p-2 md:p-3">
                <p className="line-clamp-2 text-xs md:text-sm font-medium text-zinc-100 transition-colors group-hover:text-white">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-zinc-500 hidden md:block">
                  {item.channelTitle}
                </p>
                {(item.duration || item.viewCount) && (
                  <div className="mt-2 flex gap-2 text-xs text-zinc-600">
                    {item.duration && (
                      <span className="inline-flex items-center gap-1">
                        <span>⏱</span>
                        {item.duration}
                      </span>
                    )}
                    {item.viewCount && (
                      <span className="inline-flex items-center gap-1">
                        <span>👁</span>
                        {item.viewCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
