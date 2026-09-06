export interface ScreenCalibration {
  version: 1;
  pixelsPerMm: number;
  cardWidthPx: number;
  referenceWidthMm: 85.6;
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
  calibratedAt: string;
}

export interface DistanceCalibration {
  version: 1;
  mode: "camera" | "manual";
  referenceDistanceCm?: number;
  referenceFaceScale?: number;
  manualDistanceCm?: number;
  calibratedAt: string;
}
