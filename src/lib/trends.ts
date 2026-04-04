import type { Preference } from "./types";

/** Used when Google Trends data is unavailable. */
export const FALLBACK_TREND_SEEDS: Record<Preference, string[]> = {
  news: [
    "World headlines",
    "US politics",
    "Climate",
    "Tech regulation",
    "Economy",
    "Space",
    "Health",
    "Elections",
  ],
  music: [
    "Chart hits",
    "Hip hop",
    "Pop",
    "Rock",
    "R&B",
    "Electronic",
    "Country",
    "Indie",
  ],
  movies: [
    "New trailers",
    "Sci-fi",
    "Action",
    "Oscars",
    "Streaming",
    "Animation",
    "Horror",
    "Documentary",
  ],
};
