"use client";

import { useEffect, useRef } from "react";

type SwipeDirection = "left" | "right";

interface TouchGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // minimum distance in pixels
}

export function useTouchGestures(
  ref: React.RefObject<HTMLElement>,
  options: TouchGesturesOptions,
) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const threshold = options.threshold ?? 50;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const diff = touchStartX.current - touchEndX.current;

      if (Math.abs(diff) < threshold) return;

      if (diff > 0) {
        // Swiped left
        options.onSwipeLeft?.();
      } else {
        // Swiped right
        options.onSwipeRight?.();
      }
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, threshold, options]);
}
