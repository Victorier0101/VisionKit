export function clamp(value: number, min: number, max: number): number {
  if (![value, min, max].every(Number.isFinite) || min > max) {
    throw new Error("Clamp requires finite values and an ordered range");
  }

  return Math.min(max, Math.max(min, value));
}
