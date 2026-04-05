"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { YoutubeSearchItem } from "@/lib/types";
import { useLocation } from "@/hooks/useLocation";
import { TrendChips } from "@/components/TrendChips";
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
  const [queryInput, setQueryInput] = useState("");
  const [items, setItems] = useState<YoutubeSearchItem[]>([]);
  const [active, setActive] = useState<YoutubeSearchItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trendChips, setTrendChips] = useState<string[]>(GENERIC_FALLBACK);
  const [trendsSource, setTrendsSource] = useState<TrendsSource>("fallback");
  const [trendsLoading, setTrendsLoading] = useState(true);
  const trendsAbort = useRef<AbortController | null>(null);

  // Fetch trends for a given query (or daily trends if empty)
  const fetchTrends = useCallback((query: string, geo: string) => {
    trendsAbort.current?.abort();
    const ac = new AbortController();
    trendsAbort.current = ac;
    setTrendsLoading(true);

    const url = query
      ? `/api/trends?query=${encodeURIComponent(query)}&geo=${encodeURIComponent(geo)}`
      : `/api/trends?geo=${encodeURIComponent(geo)}`;

    fetch(url, { signal: ac.signal })
      .then((res) => res.json())
      .then((data: { queries?: string[]; source?: TrendsSource }) => {
        if (data.queries && data.queries.length > 0) {
          setTrendChips(data.queries);
          setTrendsSource(data.source ?? "fallback");
        }
      })
      .catch(() => {})
      .finally(() => setTrendsLoading(false));
  }, []);

  // On mount / location change, load daily trending
  useEffect(() => {
    if (!locationReady) return;
    fetchTrends("", location);
  }, [location, locationReady, fetchTrends]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}`);
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
    } catch {
      setError("Network error");
      setItems([]);
      setActive(null);
    } finally {
      setLoading(false);
    }
  }, [location, fetchTrends]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(queryInput);
  };

  if (!locationReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 pb-8">
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 sm:px-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Discover
        </h1>
        <p className="mt-1 text-sm text-zinc-500 hidden sm:block">
          Search anything — trending topics update to match your query.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={onSubmit} className="mb-6 flex gap-2">
        <input
          type="search"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search videos…"
          className="min-h-11 flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-4 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
        />
        <button
          type="submit"
          disabled={loading || !queryInput.trim()}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40 whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Trend chips — horizontal scrollable row */}
      <div className="mb-2 flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Trending
        </span>
        {trendsLoading ? (
          <span className="text-xs text-zinc-600">Updating…</span>
        ) : trendsSource === "google-trends" ? (
          <span className="text-xs text-emerald-500/80">Live</span>
        ) : null}
      </div>
      <div className="mb-8">
        <TrendChips
          trends={trendChips}
          busy={loading}
          onPick={(label) => {
            setQueryInput(label);
            void runSearch(label);
          }}
        />
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Video layout */}
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Now playing
          </h2>
          <VideoEmbed videoId={active?.id ?? null} title={active?.title} />
          {active ? (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-300">{active.title}</p>
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
    </div>
  );
}
