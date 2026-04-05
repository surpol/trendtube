import { NextResponse } from "next/server";

// CJS package — require avoids ESM interop issues in the App Router bundle.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api") as {
  relatedQueries: (opts: Record<string, unknown>) => Promise<string>;
  dailyTrends: (opts: Record<string, unknown>) => Promise<string>;
};

type RankedKeyword = { query?: string };

function extractRelatedQueries(jsonStr: string): string[] {
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
  const out: string[] = [];

  for (const block of lists) {
    for (const kw of block.rankedKeyword ?? []) {
      const q = kw.query?.trim();
      if (!q) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
    }
  }

  return out.slice(0, 20);
}

function extractDailyTrends(jsonStr: string): string[] {
  let data: {
    default?: {
      trendingSearchesDays?: Array<{
        trendingSearches?: Array<{ title?: { query?: string } }>;
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
  const out: string[] = [];

  for (const day of days) {
    for (const trend of day.trendingSearches ?? []) {
      const q = trend.title?.query?.trim();
      if (!q) continue;
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
    }
  }

  return out.slice(0, 20);
}

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || "";
  const geo = searchParams.get("geo")?.trim() || "US";

  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 86400000);

  try {
    if (query) {
      // Fetch related queries for the specific search term
      const raw = await googleTrends.relatedQueries({
        keyword: query,
        startTime,
        endTime,
        geo,
        hl: "en-US",
      });

      const queries = extractRelatedQueries(raw);
      if (queries.length > 0) {
        return NextResponse.json({ queries, source: "google-trends" as const });
      }
    } else {
      // No query — fetch today's trending searches for the region
      const raw = await googleTrends.dailyTrends({ geo, hl: "en-US" });
      const queries = extractDailyTrends(raw);
      if (queries.length > 0) {
        return NextResponse.json({ queries, source: "google-trends" as const });
      }
    }
  } catch {
    // fall through to fallback
  }

  return NextResponse.json({
    queries: GENERIC_FALLBACK,
    source: "fallback" as const,
  });
}
