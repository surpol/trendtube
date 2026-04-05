"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { YoutubeSearchItem } from "@/lib/types";
import { useLocation } from "@/hooks/useLocation";
import { TrendChips } from "@/components/TrendChips";
import { KeyboardHints } from "@/components/KeyboardHints";
import { VideoEmbed } from "@/components/VideoEmbed";
import { VideoResults } from "@/components/VideoResults";

type TrendsSource = "google-trends" | "fallback";

export type TrendItem = {
  query: string;
  value?: number;
};

const GENERIC_FALLBACK: TrendItem[] = [
  { query: "Music videos", value: 75 },
  { query: "Latest news", value: 85 },
  { query: "Movie trailers", value: 70 },
  { query: "Sports highlights", value: 80 },
  { query: "Tech reviews", value: 65 },
  { query: "Gaming", value: 90 },
  { query: "Comedy", value: 72 },
  { query: "Cooking", value: 60 },
];

export function DiscoverClient() {
  const { location, ready: locationReady } = useLocation();

  const [queryInput, setQueryInput] = useState("");
  const [items, setItems] = useState<YoutubeSearchItem[]>([]);
  const [active, setActive] = useState<YoutubeSearchItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trendChips, setTrendChips] = useState<TrendItem[]>(GENERIC_FALLBACK);
  const [trendsSource, setTrendsSource] = useState<TrendsSource>("fallback");
  const [trendsLoading, setTrendsLoading] = useState(true);

  const trendsAbort = useRef<AbortController | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  // Derive filtered trends from trendChips + queryInput (no circular deps)
  const filteredTrends = useMemo(() => {
    const q = queryInput.trim().toLowerCase();
    if (!q) return trendChips;
    return trendChips.filter((chip) =>
      chip.query.toLowerCase().includes(q),
    );
  }, [trendChips, queryInput]);

  // Fetch trends — stable callback, no state in deps
  const fetchTrends = useCallback((query: string, geo: string) => {
    trendsAbort.current?.abort();
    const ac = new AbortController();
    trendsAbort.current = ac;
    setTrendsLoading(true);

    const timeout = setTimeout(() => ac.abort(), 10000);
    const url = query
      ? `/api/trends?query=${encodeURIComponent(query)}&geo=${encodeURIComponent(geo)}`
      : `/api/trends?geo=${encodeURIComponent(geo)}`;

    fetch(url, { signal: ac.signal })
      .then((res) => res.json())
      .then((data: { queries?: TrendItem[]; source?: TrendsSource }) => {
        if (data.queries && data.queries.length > 0) {
          setTrendChips(data.queries);
          setTrendsSource(data.source ?? "fallback");
        }
      })
      .catch(() => {
        // Silently fall back on error / abort
      })
      .finally(() => {
        clearTimeout(timeout);
        setTrendsLoading(false);
      });
  }, []); // No deps — uses only args and refs

  // On mount / location change, load daily trending (runs once per location)
  useEffect(() => {
    if (!locationReady) return;
    fetchTrends("", location);
  }, [location, locationReady, fetchTrends]);

  // Search YouTube + refresh trends for the query
  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;

      setLoading(true);
      setError(null);

      searchAbort.current?.abort();
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 15000);
      searchAbort.current = ac;

      try {
        const res = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(q)}`,
          { signal: ac.signal },
        );
        const data = (await res.json()) as {
          items?: YoutubeSearchItem[];
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? "Search failed");
          setItems([]);
          setActive(null);
          return;
        }

        setItems(data.items ?? []);
        setActive(data.items?.[0] ?? null);

        // Update trends relative to what was searched
        fetchTrends(q, locationRef.current);
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        setError(isAbort ? "Search timed out. Try again." : "Network error");
        setItems([]);
        setActive(null);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    },
    [fetchTrends],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(queryInput);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const idx = items.findIndex((i) => i.id === active?.id);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (items.length)
            setActive(items[idx > 0 ? idx - 1 : items.length - 1]);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (items.length)
            setActive(items[idx < items.length - 1 ? idx + 1 : 0]);
          break;
        case "Escape":
          e.preventDefault();
          setActive(null);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, active]);

  /* ---- Render ---- */

  if (!locationReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 pb-8">
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-8 sm:px-6 pb-8">
      {/* Header */}
      <div className="mb-5 sm:mb-6 animate-slide-in duration-300">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Discover
        </h1>
        <p className="mt-1 text-sm text-zinc-500 hidden sm:block">
          Search anything — trending topics update to match your query.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={onSubmit}
        className="mb-5 sm:mb-6 relative animate-slide-in duration-300"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex gap-2 sm:gap-3">
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search videos…"
            className="flex-1 min-h-12 sm:min-h-11 rounded-lg sm:rounded-xl border border-white/10 bg-zinc-900/60 px-3 sm:px-4 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition touch-manipulation"
          />
          <button
            type="submit"
            disabled={loading || !queryInput.trim()}
            className="rounded-lg sm:rounded-xl bg-[var(--accent)] px-4 sm:px-5 py-3 sm:py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40 active:scale-95 whitespace-nowrap touch-manipulation min-h-12 sm:min-h-auto"
          >
            Search
          </button>
        </div>
      </form>

      {/* Trending */}
      <div
        className="mb-2 sm:mb-3 flex items-center gap-2 animate-slide-in duration-300"
        style={{ animationDelay: "100ms" }}
      >
        <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Trending
        </span>
        {trendsLoading ? (
          <span className="text-xs text-zinc-600 animate-pulse-soft">
            Updating…
          </span>
        ) : trendsSource === "google-trends" ? (
          <span className="text-xs text-emerald-500/80">Live</span>
        ) : null}
        {queryInput && filteredTrends.length > 0 && (
          <span className="text-xs text-zinc-600">
            {filteredTrends.length} match
            {filteredTrends.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>
      <div
        className="mb-7 sm:mb-8 transition-all animate-scale-in duration-300"
        style={{ animationDelay: "150ms" }}
      >
        <TrendChips
          trends={filteredTrends}
          busy={loading}
          onPick={(query) => {
            setQueryInput(query);
            void runSearch(query);
          }}
        />
        {queryInput &&
          filteredTrends.length === 0 &&
          trendChips.length > 0 && (
            <p className="text-xs text-zinc-600 mt-3">
              No matching trends for &ldquo;{queryInput}&rdquo;
            </p>
          )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg sm:rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-scale-in duration-300">
          {error}
        </div>
      )}

      {/* Video layout */}
      <div
        className="grid gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-8 animate-scale-in duration-300"
        style={{ animationDelay: "200ms" }}
      >
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Now playing
          </h2>
          <VideoEmbed videoId={active?.id ?? null} title={active?.title} />
          {active && (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-300 transition-all">
              {active.title}
            </p>
          )}
        </section>
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Results
          </h2>
          <VideoResults
            items={items}
            activeId={active?.id ?? null}
            loading={loading}
            onSelect={setActive}
          />
        </section>
      </div>

      <KeyboardHints />
    </div>
  );
}
