"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "trendtube-location";
const FALLBACK_LOCATION = "US";

// Common country codes and names
export const COUNTRY_CODES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "KR", name: "South Korea" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
];

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

async function getLocationFromCoordinates(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { signal: AbortSignal.timeout(5000) },
    );
    const data = (await response.json()) as { address?: { country_code?: string } };
    const code = data.address?.country_code?.toUpperCase();
    return code ?? null;
  } catch {
    return null;
  }
}

export function useLocation() {
  const [location, setLocationState] = useState<string>(FALLBACK_LOCATION);
  const [ready, setReady] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    // Try to load from storage first
    const stored = readStored();
    if (stored) {
      setLocationState(stored);
      setReady(true);
      return;
    }

    // If not in storage, try to detect from browser geolocation
    if (!("geolocation" in navigator)) {
      setReady(true);
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const code = await getLocationFromCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (code) {
          setLocationState(code);
          localStorage.setItem(STORAGE_KEY, code);
        }
        setDetecting(false);
        setReady(true);
      },
      () => {
        // Permission denied or error, use fallback
        setDetecting(false);
        setReady(true);
      },
    );
  }, []);

  const setLocation = useCallback((code: string) => {
    setLocationState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  return { location, setLocation, ready, detecting };
}
