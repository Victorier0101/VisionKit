import type { DistanceCalibration, ScreenCalibration } from "./calibration";
import type { EyeMode, TestType } from "./tests";

export interface TestResult {
  id: string;
  testType: TestType;
  eyeMode: EyeMode | null;
  score: number;
  scoreVersion: "v1";
  rawMetrics: Record<string, number | string | boolean>;
  calibrationSnapshot: {
    screen?: ScreenCalibration;
    distance?: DistanceCalibration;
  } | null;
  createdAt: string;
}
