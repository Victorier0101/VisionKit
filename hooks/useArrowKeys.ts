"use client";
import { useEffect } from "react";
import type { Direction } from "@/lib/tests/random";
const keys: Partial<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowLeft: "left",
};

export function mapArrowKeyToDirection(key: string): Direction | null {
  return keys[key] ?? null;
}

export function useArrowKeys(active: boolean, onDirection: (direction: Direction) => void) {
  useEffect(() => {
    if (!active) return;
    const handle = (event: KeyboardEvent) => {
      const direction = mapArrowKeyToDirection(event.key);
      if (!direction || event.repeat) return;
      event.preventDefault();
      onDirection(direction);
    };
    window.addEventListener("keydown", handle, { passive: false });
    return () => window.removeEventListener("keydown", handle);
  }, [active, onDirection]);
}
