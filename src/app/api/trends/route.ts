import { NextResponse } from "next/server";

export type TrendItem = {
  query: string;
  value?: number;
};

const GENERIC_FALLBACK: TrendItem[] = [
  { query: "Cavs vs Celtics", value: 95 },
  { query: "Cavs score today", value: 88 },
  { query: "Donovan Mitchell", value: 82 },
  { query: "Cleveland Cavaliers", value: 79 },
  { query: "NBA standings", value: 75 },
  { query: "Cavs trade news", value: 72 },
  { query: "Eastern Conference", value: 68 },
  { query: "LeBron James news", value: 65 },
];

/**
 * Fetch Google Trends data by querying the trends widget API
 * This is what the web UI uses to get related queries data
 */
async function fetchGoogleTrendsRelated(
  keyword: string,
  geo: string,
): Promise<TrendItem[]> {
  try {
    // Google Trends uses this endpoint to get related queries
    const url = new URL("https://trends.google.com/trends/api/widgetdata/relatedsearches");
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("tz", "0");
    url.searchParams.set("req", JSON.stringify({
      comparisonItem: [
        {
          keyword: keyword,
          geo: geo,
          time: "now 7-d", // past 7 days
        },
      ],
      category: 0,
      property: "youtube", // Get YouTube-relevant trends
    }));

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://trends.google.com/",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    let text = await response.text();
    // Google wraps JSON response with )]}' prefix
    text = text.replace(/^\)\]\}'\n/, "").trim();

    if (!text) return [];

    const data = JSON.parse(text) as {
      default?: {
        rankedList?: Array<{
          rankedKeyword?: Array<{
            query?: string;
            value?: number;
            formattedValue?: string;
            hasData?: boolean[];
            link?: string;
          }>;
        }>;
      };
    };

    const trends: TrendItem[] = [];
    const lists = data.default?.rankedList ?? [];

    for (const block of lists) {
      for (const kw of block.rankedKeyword ?? []) {
        if (kw.query && kw.value) {
          trends.push({
            query: kw.query,
            value: kw.value,
          });
        }
      }
    }

    return trends.slice(0, 20);
  } catch (err) {
    console.error("[trends] relatedsearches fetch failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Fetch daily trending searches for a region
 */
async function fetchDailyTrends(geo: string): Promise<TrendItem[]> {
  try {
    const url = new URL("https://trends.google.com/trends/api/dailytrends");
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("tz", "0");
    url.searchParams.set("geo", geo);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://trends.google.com/",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return [];

    let text = await response.text();
    text = text.replace(/^\)\]\}'\n/, "").trim();

    if (!text) return [];

    const data = JSON.parse(text) as {
      default?: {
        trendingSearchesDays?: Array<{
          trendingSearches?: Array<{
            title?: { query?: string };
            formattedTraffic?: string;
            relatedQueries?: Array<{ query?: string }>;
            articles?: Array<{ title?: string; url?: string }>;
          }>;
        }>;
      };
    };

    const trends: TrendItem[] = [];
    const days = data.default?.trendingSearchesDays ?? [];

    for (const day of days) {
      for (const search of day.trendingSearches ?? []) {
        if (search.title?.query) {
          // Extract numeric value from formatted traffic string (e.g., "100K+" → 90)
          let value = 70;
          if (search.formattedTraffic) {
            const match = search.formattedTraffic.match(/^(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              value = Math.min(100, Math.max(50, Math.floor(num / 10)));
            }
          }

          trends.push({
            query: search.title.query,
            value,
          });
        }
      }
    }

    return trends.slice(0, 20);
  } catch (err) {
    console.error("[trends] dailytrends fetch failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

// In-memory cache with TTL
const cache = new Map<
  string,
  { data: TrendItem[]; expires: number; source: "google" | "fallback" }
>();

function getCacheKey(query: string, geo: string, type: string): string {
  return `${type}:${query}:${geo}`;
}

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }
  cache.delete(key);
  return undefined;
}

function setCache(
  key: string,
  data: TrendItem[],
  source: "google" | "fallback",
  ttlMs = 3600000, // 1 hour
): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
    source,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";
  const geo = searchParams.get("geo")?.trim() || "US";

  try {
    if (query) {
      // Related queries for a search term
      const cacheKey = getCacheKey(query, geo, "related");
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({
          queries: cached.data,
          source: cached.source,
        });
      }

      const data = await fetchGoogleTrendsRelated(query, geo);
      if (data.length > 0) {
        setCache(cacheKey, data, "google");
        return NextResponse.json({ queries: data, source: "google" });
      }
    } else {
      // Daily trending searches
      const cacheKey = getCacheKey("daily", geo, "daily");
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({
          queries: cached.data,
          source: cached.source,
        });
      }

      const data = await fetchDailyTrends(geo);
      if (data.length > 0) {
        setCache(cacheKey, data, "google");
        return NextResponse.json({ queries: data, source: "google" });
      }
    }
  } catch (err) {
    console.error("[trends] error:", err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({
    queries: GENERIC_FALLBACK,
    source: "fallback",
  });
}
