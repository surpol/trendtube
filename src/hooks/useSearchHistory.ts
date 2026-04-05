"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "trendtube-search-history";
const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistoryState] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistoryState(JSON.parse(stored) as string[]);
      } catch {
        // ignore parse errors
      }
    }
    setReady(true);
  }, []);

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setHistoryState((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistoryState([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, clearHistory, ready };
}
