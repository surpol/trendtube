"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { YoutubeSearchItem } from "@/lib/types";
import { useLocation } from "@/hooks/useLocation";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { TrendChips } from "@/components/TrendChips";
import { SearchHistory } from "@/components/SearchHistory";
import { KeyboardHints } from "@/components/KeyboardHints";
import { VideoEmbed } from "@/components/VideoEmbed";
import { VideoResults } from "@/components/VideoResults";

type TrendsSource = "google-trends" | "fallback";

const GENERIC_FALLBACK = [
  "Music videos",
  "Latest news",
  "Movie trailers",
  "Sports highlights",
  "Tech reviews",
  "Gaming",
  "Comedy",
  "Cooking",
];

export function DiscoverClient() {
  const { location, ready: locationReady } = useLocation();
  const { history, addToHistory, clearHistory, ready: historyReady } = useSearchHistory();
  const [queryInput, setQueryInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [items, setItems] = useState<YoutubeSearchItem[]>([]);
  const [active, setActive] = useState<YoutubeSearchItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trendChips, setTrendChips] = useState<string[]>(GENERIC_FALLBACK);
  const [filteredTrends, setFilteredTrends] = useState<string[]>(GENERIC_FALLBACK);
  const [trendsSource, setTrendsSource] = useState<TrendsSource>("fallback");
  const [trendsLoading, setTrendsLoading] = useState(true);
  const trendsAbort = useRef<AbortController | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  // Filter trends based on user input
  const filterTrends = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredTrends(trendChips);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = trendChips.filter((chip) =>
      chip.toLowerCase().includes(lower),
    );
    setFilteredTrends(filtered);
  }, [trendChips]);

  // Update filtered trends when input changes
  useEffect(() => {
    filterTrends(queryInput);
  }, [queryInput, filterTrends]);

  // Fetch trends for a given query (or daily trends if empty)
  const fetchTrends = useCallback((query: string, geo: string) => {
    trendsAbort.current?.abort();
    const ac = new AbortController();
    trendsAbort.current = ac;
    setTrendsLoading(true);

    const timeout = setTimeout(() => ac.abort(), 10000); // 10 second timeout
    const url = query
      ? `/api/trends?query=${encodeURIComponent(query)}&geo=${encodeURIComponent(geo)}`
      : `/api/trends?geo=${encodeURIComponent(geo)}`;

    fetch(url, { signal: ac.signal })
      .then((res) => res.json())
      .then((data: { queries?: string[]; source?: TrendsSource }) => {
        if (data.queries && data.queries.length > 0) {
          setTrendChips(data.queries);
          filterTrends(queryInput);
          setTrendsSource(data.source ?? "fallback");
        }
      })
      .catch(() => {
        // Silently fall back on error
      })
      .finally(() => {
        clearTimeout(timeout);
        setTrendsLoading(false);
      });
  }, [queryInput, filterTrends]);

  // On mount / location change, load daily trending
  useEffect(() => {
    if (!locationReady) return;
    fetchTrends("", location);
  }, [location, locationReady, fetchTrends]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;

    setShowHistory(false);
    addToHistory(q);
    setLoading(true);
    setError(null);

    searchAbort.current?.abort();
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 15000); // 15 second timeout
    searchAbort.current = ac;

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`, {
        signal: ac.signal,
      });
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
      const first = data.items?.[0];
      setActive(first ?? null);

      // Update trends relative to what was searched
      fetchTrends(q, location);
    } catch (err) {
      const isAborted = err instanceof Error && err.name === "AbortError";
      setError(isAborted ? "Search timed out. Try again." : "Network error");
      setItems([]);
      setActive(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [location, addToHistory, fetchTrends]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(queryInput);
  };

  const handleHistorySelect = (query: string) => {
    setQueryInput(query);
    void runSearch(query);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input focus
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentIndex = items.findIndex((item) => item.id === active?.id);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (items.length === 0) return;
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          setActive(items[prevIndex]);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (items.length === 0) return;
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          setActive(items[nextIndex]);
          break;
        case "Enter":
          e.preventDefault();
          if (active && queryInput.trim()) {
            void runSearch(queryInput);
          }
          break;
        case "Escape":
          e.preventDefault();
          setActive(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, active, queryInput, runSearch]);

  if (!locationReady || !historyReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 pb-8">
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-8 sm:px-6 pb-8 animate-fade-in">
      {/* Header */}
      <div className="mb-5 sm:mb-6 animate-slide-in duration-300">
        <h1 className="font-display text-2xl sm:text-3xl md:text-3xl font-semibold tracking-tight text-white">
          Discover
        </h1>
        <p className="mt-1 text-sm text-zinc-500 hidden sm:block">
          Search anything — trending topics update to match your query.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={onSubmit} className="mb-5 sm:mb-6 relative animate-slide-in duration-300" style={{ animationDelay: "50ms" }}>
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <input
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onFocus={() => setShowHistory(true)}
              placeholder="Search videos…"
              className="w-full min-h-12 sm:min-h-11 rounded-lg sm:rounded-xl border border-white/10 bg-zinc-900/60 px-3 sm:px-4 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 transition touch-manipulation"
            />
            <SearchHistory
              history={history}
              onSelect={handleHistorySelect}
              onClear={clearHistory}
              show={showHistory && queryInput === ""}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !queryInput.trim()}
            className="rounded-lg sm:rounded-xl bg-[var(--accent)] px-4 sm:px-5 py-3 sm:py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40 active:scale-95 whitespace-nowrap touch-manipulation min-h-12 sm:min-h-auto"
          >
            Search
          </button>
        </div>
      </form>

      {/* Trend chips — horizontal scrollable row with live filtering */}
      <div className="mb-2 sm:mb-3 flex items-center gap-2 animate-slide-in duration-300" style={{ animationDelay: "100ms" }}>
        <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Trending
        </span>
        {trendsLoading ? (
          <span className="text-xs text-zinc-600 animate-pulse-soft">Updating…</span>
        ) : trendsSource === "google-trends" ? (
          <span className="text-xs text-emerald-500/80">Live</span>
        ) : null}
        {queryInput && filteredTrends.length > 0 && (
          <span className="text-xs text-zinc-600">
            {filteredTrends.length} match{filteredTrends.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>
      <div className="mb-7 sm:mb-8 transition-all animate-scale-in duration-300" style={{ animationDelay: "150ms" }}>
        <TrendChips
          trends={filteredTrends}
          busy={loading}
          onPick={(label) => {
            setQueryInput(label);
            void runSearch(label);
          }}
        />
        {queryInput && filteredTrends.length === 0 && trendChips.length > 0 && (
          <p className="text-xs text-zinc-600 mt-3 animate-fade-in duration-300">
            No matching trends for "{queryInput}"
          </p>
        )}
      </div>

      {error ? (
        <div className="mb-6 rounded-lg sm:rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-in fade-in animate-scale-in duration-300">
          {error}
        </div>
      ) : null}

      {/* Video layout */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-8 animate-scale-in duration-300" style={{ animationDelay: "200ms" }}>
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Now playing
          </h2>
          <VideoEmbed videoId={active?.id ?? null} title={active?.title} />
          {active ? (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-300 transition-all animate-fade-in duration-300">{active.title}</p>
          ) : null}
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
