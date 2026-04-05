import type { YoutubeSearchItem } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function joinRuns(runs: unknown): string {
  if (!Array.isArray(runs)) return "";
  return runs
    .map((r) =>
      typeof r === "object" && r !== null && "text" in r
        ? String((r as { text?: string }).text ?? "")
        : "",
    )
    .join("");
}

function textFromObject(obj: unknown): string {
  if (obj === null || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  if (typeof o.simpleText === "string") return o.simpleText;
  if (o.runs) return joinRuns(o.runs);
  return "";
}

function pickThumbnail(thumb: unknown): string {
  if (!thumb || typeof thumb !== "object") return "";
  const thumbs = (thumb as { thumbnails?: Array<{ url?: string; width?: number }> })
    .thumbnails;
  if (!Array.isArray(thumbs) || thumbs.length === 0) return "";
  return [...thumbs].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";
}

function channelFromRenderer(vr: Record<string, unknown>): string {
  return (
    textFromObject(vr.longBylineText) ||
    textFromObject(vr.shortBylineText) ||
    textFromObject(vr.ownerText) ||
    ""
  );
}

function rendererToItem(vr: Record<string, unknown>): YoutubeSearchItem | null {
  const videoId = vr.videoId;
  if (typeof videoId !== "string" || !videoId) return null;
  const title = textFromObject(vr.title) || "Untitled";
  const publishedAt = textFromObject(vr.publishedTimeText) || "";
  const viewCount = textFromObject(vr.viewCountText) || textFromObject(vr.shortViewCountText);
  const duration = textFromObject(vr.lengthText);

  const item: YoutubeSearchItem = {
    id: videoId,
    title,
    channelTitle: channelFromRenderer(vr),
    thumbnailUrl: pickThumbnail(vr.thumbnail),
    publishedAt,
  };

  if (viewCount) item.viewCount = viewCount;
  if (duration) item.duration = duration;

  return item;
}

function walk(node: unknown, ordered: YoutubeSearchItem[], seen: Set<string>): void {
  if (node === null || node === undefined) return;
  if (typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, ordered, seen);
    return;
  }
  const o = node as Record<string, unknown>;
  for (const key of ["videoRenderer", "compactVideoRenderer", "gridVideoRenderer"] as const) {
    const vr = o[key];
    if (vr && typeof vr === "object") {
      const item = rendererToItem(vr as Record<string, unknown>);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        ordered.push(item);
      }
    }
  }
  for (const v of Object.values(o)) walk(v, ordered, seen);
}

/** Extract JSON object starting at opening brace (handles strings with braces). */
function sliceBalancedJson(html: string, startBrace: number): string | null {
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote: string | null = null;

  for (let i = startBrace; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (quote && c === quote) {
        inString = false;
        quote = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return html.slice(startBrace, i + 1);
    }
  }
  return null;
}

export function extractItemsFromResultsHtml(html: string): YoutubeSearchItem[] {
  const marker = "var ytInitialData = ";
  const mi = html.indexOf(marker);
  if (mi === -1) return [];

  const brace = html.indexOf("{", mi + marker.length);
  if (brace === -1) return [];

  const jsonStr = sliceBalancedJson(html, brace);
  if (!jsonStr) return [];

  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  const ordered: YoutubeSearchItem[] = [];
  const seen = new Set<string>();
  walk(data, ordered, seen);
  return ordered;
}

export async function fetchYoutubeSearchItems(
  searchQuery: string,
  maxResults = 24,
  options?: { sp?: string },
): Promise<YoutubeSearchItem[]> {
  const url = new URL("https://www.youtube.com/results");
  url.searchParams.set("search_query", searchQuery);
  if (options?.sp) {
    url.searchParams.set("sp", options.sp);
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`YouTube returned ${res.status}`);
  }

  const html = await res.text();
  const items = extractItemsFromResultsHtml(html);
  return items.slice(0, maxResults);
}
