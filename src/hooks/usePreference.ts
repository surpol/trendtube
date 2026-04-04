"use client";

import { useCallback, useEffect, useState } from "react";
import type { Preference } from "@/lib/types";

const STORAGE_KEY = "trendtube-preference";

const VALID: Preference[] = ["news", "music", "movies"];

function readStored(): Preference | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v && (VALID as string[]).includes(v)) return v as Preference;
  return null;
}

export function usePreference() {
  const [preference, setPreferenceState] = useState<Preference>("music");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) setPreferenceState(stored);
    setReady(true);
  }, []);

  const setPreference = useCallback((p: Preference) => {
    setPreferenceState(p);
    localStorage.setItem(STORAGE_KEY, p);
  }, []);

  return { preference, setPreference, ready };
}
