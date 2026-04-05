import { NextResponse } from "next/server";

// CJS package — require avoids ESM interop issues in the App Router bundle.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api") as {
  relatedQueries: (opts: Record<string, unknown>) => Promise<string>;
  dailyTrends: (opts: Record<string, unknown>) => Promise<string>;
};

type RankedKeyword = { query?: string; value?: number };
type TrendItem = { query: string; value?: number; isRising?: boolean };

function extractRelatedQueries(jsonStr: string): TrendItem[] {
  let data: {
    default?: {
      rankedList?: Array<{ rankedKeyword?: RankedKeyword[] }>;
    };
  };
  try {
    data = JSON.parse(jsonStr) as typeof data;
  } catch {
    return [];
  }

  const lists = data.default?.rankedList ?? [];
  const seen = new Set<string>();
  const out: TrendItem[] = [];

  for (const block of lists) {
    for (const kw of block.rankedKeyword ?? []) {
      const q = kw.query?.trim();
      if (!q) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        query: q,
        value: kw.value,
      });
    }
  }

  return out.slice(0, 20);
}

function extractDailyTrends(jsonStr: string): TrendItem[] {
  let data: {
    default?: {
      trendingSearchesDays?: Array<{
        trendingSearches?: Array<{
          title?: { query?: string };
          trafficSparkline?: string;
          relatedQueries?: Array<{ query?: string }>;
          articleRenderingMetadata?: {
            trendingSearchesDayUE?: {
              trafficVolume?: Array<{ trafficVolume?: { simpleText?: string } }>;
            };
          };
        }>;
      }>;
    };
  };
  try {
    // daily trends response wraps JSON in ")]}'\n"
    const cleaned = jsonStr.replace(/^\)\]\}',?\n/, "");
    data = JSON.parse(cleaned) as typeof data;
  } catch {
    return [];
  }

  const days = data.default?.trendingSearchesDays ?? [];
  const seen = new Set<string>();
  const out: TrendItem[] = [];

  for (const day of days) {
    for (const trend of day.trendingSearches ?? []) {
      const q = trend.title?.query?.trim();
      if (!q) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        query: q,
        value: undefined, // Daily trends don't provide normalized values
      });
    }
  }

  return out.slice(0, 20);
}

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

/** Race a promise against a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms),
    ),
  ]);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";
  const geo = searchParams.get("geo")?.trim() || "US";

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 86400000);

  try {
    if (query) {
      const raw = await withTimeout(
        googleTrends.relatedQueries({
          keyword: query,
          startTime,
          endTime,
          geo,
          hl: "en-US",
        }),
        8000,
      );

      const queries = extractRelatedQueries(raw);
      if (queries.length > 0) {
        return NextResponse.json({ queries, source: "google-trends" as const });
      }
    } else {
      const raw = await withTimeout(
        googleTrends.dailyTrends({ geo, hl: "en-US" }),
        8000,
      );

      const queries = extractDailyTrends(raw);
      if (queries.length > 0) {
        return NextResponse.json({ queries, source: "google-trends" as const });
      }
    }
  } catch {
    // Timeout or API error — fall through to fallback
  }

  return NextResponse.json({
    queries: GENERIC_FALLBACK,
    source: "fallback" as const,
  });
}
