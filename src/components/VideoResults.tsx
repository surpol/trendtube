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
            className="h-28 sm:h-36 animate-pulse rounded-lg md:rounded-xl bg-zinc-800/60"
          />
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
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`group w-full overflow-hidden rounded-lg md:rounded-xl border text-left transition ${
                active
                  ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/40"
                  : "border-white/10 hover:border-white/20"
              } bg-zinc-900/40`}
            >
              <div className="relative aspect-video w-full bg-zinc-800">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition group-hover:opacity-90"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : null}
              </div>
              <div className="p-2 md:p-3">
                <p className="line-clamp-2 text-xs md:text-sm font-medium text-zinc-100">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-zinc-500 hidden md:block">
                  {item.channelTitle}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
