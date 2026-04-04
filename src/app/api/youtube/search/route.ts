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
    const items = await fetchYoutubeSearchItems(q, 24, sp ? { sp } : undefined);
    if (items.length === 0) {
      return NextResponse.json({
        items: [],
        hint: "No videos parsed. Try another query, or YouTube may have changed page data.",
      });
    }
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message, items: [] }, { status: 502 });
  }
}
