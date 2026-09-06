import { clamp } from "../utils/clamp";

export const SCORE_VERSION = "v1" as const;

export function scoreFromLevel(thresholdLevel: number, minLevel: number, maxLevel: number): number {
  if (![thresholdLevel, minLevel, maxLevel].every(Number.isFinite) || minLevel >= maxLevel) {
    throw new Error("Score inputs must define a finite, non-empty level range");
  }

  const normalized = (thresholdLevel - minLevel) / (maxLevel - minLevel);
  return Math.round(clamp(normalized * 100, 0, 100));
}
