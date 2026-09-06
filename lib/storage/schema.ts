import type { DistanceCalibration, ScreenCalibration } from "@/types/calibration";
import type { TestResult } from "@/types/results";

export const STORAGE_KEY = "visionkit:v1";
export interface VisionKitStorageV1 {
  version: 1;
  calibration: {
    screen: ScreenCalibration | null;
    distance: DistanceCalibration | null;
  };
  preferences: { disclaimerAcknowledged: boolean };
  results: TestResult[];
}
export const defaultData = (): VisionKitStorageV1 => ({
  version: 1,
  calibration: { screen: null, distance: null },
  preferences: { disclaimerAcknowledged: false },
  results: [],
});
