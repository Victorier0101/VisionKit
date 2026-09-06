import type { Direction } from "../../types/tests";
import { angularSizeArcMinToCssPx } from "../calibration/geometry";
import type { StaircaseConfig } from "./staircase";

export interface AcuityTestConfig {
  id: "distance-acuity" | "near-acuity";
  targetDistanceCm: number;
  minimumDistanceCm: number;
  maximumDistanceCm: number;
  levelAngularSizesArcMin: readonly number[];
  staircase: StaircaseConfig;
}

export interface AcuityTrial {
  id: string;
  level: number;
  direction: Direction;
  angularSizeArcMin: number;
  renderedSizePx: number;
  response?: Direction;
  correct?: boolean;
  responseTimeMs?: number;
}

export const DISTANCE_ACUITY_CONFIG: AcuityTestConfig = {
  id: "distance-acuity",
  targetDistanceCm: 200,
  minimumDistanceCm: 100,
  maximumDistanceCm: 600,
  levelAngularSizesArcMin: [60, 48, 38, 30, 24, 19, 15, 12, 9.5, 7.5, 6, 4.8, 3.8],
  staircase: {
    minLevel: 0,
    maxLevel: 12,
    startLevel: 2,
    minTrials: 12,
    maxTrials: 30,
    targetReversals: 6,
    thresholdReversalCount: 4,
  },
};

export function validateViewingDistance(distanceCm: number, config: AcuityTestConfig): boolean {
  return (
    Number.isFinite(distanceCm) &&
    distanceCm >= config.minimumDistanceCm &&
    distanceCm <= config.maximumDistanceCm
  );
}

export function getAcuityRenderedSizePx(
  level: number,
  distanceCm: number,
  pixelsPerMm: number,
  config: AcuityTestConfig,
): number {
  if (!Number.isInteger(level) || level < 0 || level >= config.levelAngularSizesArcMin.length) {
    throw new Error("Acuity level is outside the configured range");
  }

  if (!validateViewingDistance(distanceCm, config)) {
    throw new Error("Viewing distance is outside the configured range");
  }

  return angularSizeArcMinToCssPx(config.levelAngularSizesArcMin[level], distanceCm, pixelsPerMm);
}

export function getAngularSizeAtThreshold(
  thresholdLevel: number,
  config: AcuityTestConfig,
): number {
  if (!Number.isFinite(thresholdLevel)) {
    throw new Error("Threshold level must be finite");
  }

  const boundedLevel = Math.min(
    config.levelAngularSizesArcMin.length - 1,
    Math.max(0, thresholdLevel),
  );
  const lowerIndex = Math.floor(boundedLevel);
  const upperIndex = Math.ceil(boundedLevel);
  if (lowerIndex === upperIndex) return config.levelAngularSizesArcMin[lowerIndex];

  const fraction = boundedLevel - lowerIndex;
  const lowerSize = config.levelAngularSizesArcMin[lowerIndex];
  const upperSize = config.levelAngularSizesArcMin[upperIndex];
  return lowerSize + (upperSize - lowerSize) * fraction;
}
