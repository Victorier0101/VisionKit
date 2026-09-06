import type { Direction } from "@/types/tests";

export type { Direction } from "@/types/tests";
export type Rng = () => number;
export const DIRECTIONS: readonly Direction[] = ["up", "right", "down", "left"];
export function getNextDirection(history: readonly Direction[], rng: Rng = Math.random): Direction {
  let choices = [...DIRECTIONS];
  const last = history.at(-1);
  if (last && history.at(-2) === last) choices = choices.filter((direction) => direction !== last);
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor(rng() * choices.length)));
  return choices[index];
}
