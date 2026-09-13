export interface NormalizedPoint {
  x: number;
  y: number;
}

export type PositionStatus =
  "good" | "move-back" | "move-closer" | "no-face" | "multiple-faces" | "unavailable";

const FACE_WIDTH_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [234, 454],
  [127, 356],
  [33, 263],
];

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
}

export function median(values: readonly number[]): number {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Median requires at least one finite value");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
}

export function calculateFaceScale(landmarks: readonly NormalizedPoint[]): number {
  const distances = FACE_WIDTH_PAIRS.map(([fromIndex, toIndex]) => {
    const from = landmarks[fromIndex];
    const to = landmarks[toIndex];
    if (!from || !to) return Number.NaN;
    return Math.hypot(to.x - from.x, to.y - from.y);
  }).filter((distance) => Number.isFinite(distance) && distance > 0);

  if (distances.length < 2) {
    throw new Error("Face landmarks are incomplete");
  }

  return median(distances);
}

export function estimateDistanceCm(
  referenceDistanceCm: number,
  referenceFaceScale: number,
  currentFaceScale: number,
): number {
  requirePositiveFinite(referenceDistanceCm, "Reference distance");
  requirePositiveFinite(referenceFaceScale, "Reference face scale");
  requirePositiveFinite(currentFaceScale, "Current face scale");
  return referenceDistanceCm * (referenceFaceScale / currentFaceScale);
}

export function getPositionStatus(
  currentDistanceCm: number,
  targetDistanceCm: number,
  toleranceRatio = 0.1,
): PositionStatus {
  requirePositiveFinite(currentDistanceCm, "Current distance");
  requirePositiveFinite(targetDistanceCm, "Target distance");
  if (!Number.isFinite(toleranceRatio) || toleranceRatio <= 0 || toleranceRatio >= 1) {
    throw new Error("Tolerance ratio must be between 0 and 1");
  }

  const ratio = currentDistanceCm / targetDistanceCm;
  if (ratio < 1 - toleranceRatio) return "move-back";
  if (ratio > 1 + toleranceRatio) return "move-closer";
  return "good";
}
