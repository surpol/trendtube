import { NextResponse } from "next/server";
import type { Preference } from "@/lib/types";
import { FALLBACK_TREND_SEEDS } from "@/lib/trends";

// CJS package — require avoids ESM interop issues in the App Router bundle.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require("google-trends-api") as {
  relatedQueries: (opts: Record<string, unknown>) => Promise<string>;
};

const KEYWORD_MAP: Record<
  Preference,
  { keyword: string; property: "" | "news" | "youtube" }
> = {
  news: { keyword: "news", property: "news" },
  music: { keyword: "music", property: "youtube" },
  movies: { keyword: "movies", property: "youtube" },
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
    const bucket = block.rankedKeyword ?? [];
    for (const kw of bucket) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const preference = searchParams.get("preference") as Preference | null;
  const geo = searchParams.get("geo")?.trim() || "US";

  if (!preference || !KEYWORD_MAP[preference]) {
    return NextResponse.json(
      { error: "Invalid or missing preference", queries: [] },
      { status: 400 },
    );
  }

  const { keyword, property } = KEYWORD_MAP[preference];
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 86400000);

  try {
    const raw = await googleTrends.relatedQueries({
      keyword,
      startTime,
      endTime,
      geo,
      property,
      hl: "en-US",
    });

    const queries = extractRelatedQueries(raw);
    if (queries.length === 0) {
      return NextResponse.json({
        queries: FALLBACK_TREND_SEEDS[preference],
        source: "fallback" as const,
        reason: "empty",
      });
    }

    return NextResponse.json({
      queries,
      source: "google-trends" as const,
    });
  } catch {
    return NextResponse.json({
      queries: FALLBACK_TREND_SEEDS[preference],
      source: "fallback" as const,
      reason: "error",
    });
  }
}
