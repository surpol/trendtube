import { NextResponse } from "next/server";
import { fetchYoutubeSearchItems } from "@/lib/parseYoutubeResultsHtml";

/**
 * Search uses YouTube's web results URL (search_query [, sp]) — not the Data API.
 * @see https://developers.google.com/youtube/v3/docs/search/list (API alternative if you switch back)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query", items: [] }, { status: 400 });
  }

  const sp = searchParams.get("sp")?.trim() || undefined;

  try {
    // Set a 12 second timeout for the search
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const searchPromise = fetchYoutubeSearchItems(q, 24, sp ? { sp } : undefined);
    const items = await Promise.race([
      searchPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Search timeout")), 12000),
      ),
    ]);

    clearTimeout(timeout);

    if (items.length === 0) {
      return NextResponse.json({
        items: [],
        hint: "No videos parsed. Try another query, or YouTube may have changed page data.",
      });
    }
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json(
      { error: message, items: [] },
      { status: e instanceof Error && e.message === "Search timeout" ? 504 : 502 },
    );
  }
}
