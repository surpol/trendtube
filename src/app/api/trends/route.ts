import { NextResponse } from "next/server";

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

/** Fetch from Google Trends explore API endpoint */
async function fetchGoogleTrendsData(
  keyword: string,
  geo: string,
  property: string = "youtube",
): Promise<TrendItem[]> {
  try {
    // Google Trends API endpoint - returns JSON for related queries
    const url = new URL("https://trends.google.com/trends/api/explore");
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("tz", "0");
    url.searchParams.set("req", JSON.stringify({
      comparisonItem: [{ keyword, geo, time: "today 7-d" }],
      category: 0,
      property,
    }));

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    let text = await response.text();
    // Google wraps JSON response - strip the prefix
    text = text.replace(/^\)\]\}'\n/, "");

    const data = JSON.parse(text) as {
      default?: {
        timelineData?: Array<{ value?: number[] }>;
        rankedList?: Array<{ rankedKeyword?: Array<{ query?: string; value?: number }> }>;
      };
    };

    // Extract related queries from rankedList
    const trends: TrendItem[] = [];
    const lists = data.default?.rankedList ?? [];

    for (const block of lists) {
      for (const kw of block.rankedKeyword ?? []) {
        if (kw.query) {
          trends.push({
            query: kw.query,
            value: kw.value,
          });
        }
      }
    }

    return trends.slice(0, 20);
  } catch {
    return [];
  }
}

/** Fetch daily trending searches */
async function fetchDailyTrends(geo: string): Promise<TrendItem[]> {
  try {
    const url = new URL("https://trends.google.com/trends/api/dailytrends");
    url.searchParams.set("hl", "en-US");
    url.searchParams.set("tz", "0");
    url.searchParams.set("geo", geo);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    let text = await response.text();
    // Google wraps JSON response
    text = text.replace(/^\)\]\}'\n/, "");

    const data = JSON.parse(text) as {
      default?: {
        trendingSearchesDays?: Array<{
          trendingSearches?: Array<{ title?: { query?: string } }>;
        }>;
      };
    };

    const trends: TrendItem[] = [];
    const days = data.default?.trendingSearchesDays ?? [];

    for (const day of days) {
      for (const search of day.trendingSearches ?? []) {
        if (search.title?.query) {
          trends.push({
            query: search.title.query,
            value: Math.floor(Math.random() * 40 + 60), // Simulate value
          });
        }
      }
    }

    return trends.slice(0, 20);
  } catch {
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

function getCached(key: string): (typeof cache)["get"] extends (k: string) => infer R
  ? R
  : never {
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

      const data = await fetchGoogleTrendsData(query, geo, "youtube");
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
  } catch {
    // Fall through to fallback
  }

  return NextResponse.json({
    queries: GENERIC_FALLBACK,
    source: "fallback",
  });
}
