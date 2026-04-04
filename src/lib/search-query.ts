import type { Preference } from "./types";

/** Manual search box + fallback topic chips — adds YouTube-friendly context. */
export function buildSearchQuery(raw: string, preference: Preference): string {
  const q = raw.trim();
  if (!q) return q;

  switch (preference) {
    case "news":
      if (/\b(latest|today|breaking|headlines?)\b/i.test(q)) {
        return `${q} video`;
      }
      return `${q} news latest`;
    case "music":
      return `${q} music official video`;
    case "movies": {
      const lower = q.toLowerCase();
      if (
        /\b(free|full|stream|watch)\b/.test(lower) &&
        /\b(movie|movies|film|films)\b/.test(lower)
      ) {
        return q;
      }
      if (/\b(trailer|trailers|teaser)\b/.test(lower)) {
        return q;
      }
      return `${q} movie trailer`;
    }
    default:
      return q;
  }
}

/**
 * Live Google Trends–derived queries are already search-shaped; only nudge
 * lightly so we do not override intent (e.g. "movies free").
 */
export function buildTrendChipQuery(raw: string, preference: Preference): string {
  const q = raw.trim();
  if (!q) return q;
  if (preference === "news") return `${q} video`;
  return q;
}

export function embedSrc(videoId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
}
