"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildSearchQuery,
  buildTrendChipQuery,
} from "@/lib/search-query";
import { FALLBACK_TREND_SEEDS } from "@/lib/trends";
import type { Preference, YoutubeSearchItem } from "@/lib/types";
import { usePreference } from "@/hooks/usePreference";
import { PreferenceBar } from "@/components/PreferenceBar";
import { TrendChips } from "@/components/TrendChips";
import { VideoEmbed } from "@/components/VideoEmbed";
import { VideoResults } from "@/components/VideoResults";

type TrendsSource = "google-trends" | "fallback";

export function DiscoverClient() {
  const { preference, setPreference, ready } = usePreference();
  const [queryInput, setQueryInput] = useState("");
  const [items, setItems] = useState<YoutubeSearchItem[]>([]);
  const [active, setActive] = useState<YoutubeSearchItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const [trendChips, setTrendChips] = useState<string[]>(
    () => FALLBACK_TREND_SEEDS.music,
  );
  const [trendsSource, setTrendsSource] = useState<TrendsSource>("fallback");
  const [trendsLoading, setTrendsLoading] = useState(true);

  useEffect(() => {
    setTrendsLoading(true);
    setTrendChips(FALLBACK_TREND_SEEDS[preference]);
    setTrendsSource("fallback");

    const ac = new AbortController();
    fetch(`/api/trends?preference=${encodeURIComponent(preference)}&geo=US`, {
      signal: ac.signal,
    })
      .then((res) => res.json())
      .then(
        (data: {
          queries?: string[];
          source?: TrendsSource;
        }) => {
          if (data.queries && data.queries.length > 0) {
            setTrendChips(data.queries);
            setTrendsSource(data.source ?? "fallback");
          }
        },
      )
      .catch(() => {})
      .finally(() => setTrendsLoading(false));

    return () => ac.abort();
  }, [preference]);

  const runYoutubeSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setHint(null);

    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(q)}`,
      );
      const data = (await res.json()) as {
        items?: YoutubeSearchItem[];
        error?: string;
        hint?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setItems([]);
        setActive(null);
        return;
      }

      setItems(data.items ?? []);
      if (data.hint && (!data.items || data.items.length === 0)) {
        setHint(data.hint);
      }
      const first = data.items?.[0];
      if (first) setActive(first);
      else setActive(null);
    } catch {
      setError("Network error");
      setItems([]);
      setActive(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void runYoutubeSearch(buildSearchQuery(queryInput, preference));
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Discover
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Topic chips use{" "}
          <span className="text-zinc-300">Google Trends</span> related
          searches (past 7 days), then YouTube search — all inline here.
        </p>
        <p className="mt-2 max-w-xl text-xs leading-relaxed text-zinc-500">
          Looking for <span className="text-zinc-400">free movies</span>? Trailer
          mode favors promos. Type or pick a Trends chip like &quot;movies
          free&quot; / &quot;full movies&quot;, or include &quot;free&quot; +
          &quot;movie&quot; in the search box — we stop adding the trailer
          suffix when that intent is clear. Most new releases are rent/purchase,
          not free.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PreferenceBar
          value={preference}
          onChange={setPreference}
          disabled={loading}
        />
      </div>

      {hint ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {hint}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmitSearch} className="mb-6 flex flex-col gap-3 sm:flex-row">
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
          className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-40"
        >
          Search
        </button>
      </form>

      <div className="mb-1 flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Trending topics
        </span>
        {trendsLoading ? (
          <span className="text-xs text-zinc-600">Updating…</span>
        ) : trendsSource === "google-trends" ? (
          <span className="text-xs text-emerald-500/90">Live · Google Trends</span>
        ) : (
          <span className="text-xs text-zinc-600">Starter topics</span>
        )}
      </div>
      <div className="mb-10">
        <TrendChips
          trends={trendChips}
          busy={loading}
          onPick={(label) => {
            setQueryInput(label);
            const q =
              trendsSource === "google-trends"
                ? buildTrendChipQuery(label, preference)
                : buildSearchQuery(label, preference);
            void runYoutubeSearch(q);
          }}
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-5 lg:gap-8">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Now playing
          </h2>
          <VideoEmbed
            videoId={active?.id ?? null}
            title={active?.title}
          />
          {active ? (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-300">
              {active.title}
            </p>
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
