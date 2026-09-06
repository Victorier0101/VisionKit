"use client";

import { useCallback, useEffect, useRef } from "react";

export function useManagedTimeout() {
  const timeoutIds = useRef(new Set<number>());

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIds.current.delete(timeoutId);
      callback();
    }, delayMs);
    timeoutIds.current.add(timeoutId);
  }, []);

  useEffect(
    () => () => {
      timeoutIds.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.current.clear();
    },
    [],
  );

  return schedule;
}
