import type { DistanceCalibration, ScreenCalibration } from "../../types/calibration";
import type { TestResult } from "../../types/results";
import { isScreenCalibration } from "../calibration/screenCalibration";
import { defaultData, STORAGE_KEY, type VisionKitStorageV1 } from "./schema";

export const MAX_RESULTS_PER_TEST = 100;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): StorageLike | null {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
    ? window.localStorage
    : null;
}

function isDistanceCalibration(value: unknown): value is DistanceCalibration {
  if (!value || typeof value !== "object") return false;
  const calibration = value as Partial<DistanceCalibration>;
  return (
    calibration.version === 1 &&
    (calibration.mode === "manual" || calibration.mode === "camera") &&
    typeof calibration.calibratedAt === "string" &&
    Number.isFinite(Date.parse(calibration.calibratedAt)) &&
    (calibration.mode !== "manual" ||
      (typeof calibration.manualDistanceCm === "number" &&
        Number.isFinite(calibration.manualDistanceCm) &&
        calibration.manualDistanceCm > 0))
  );
}

function isTestResult(value: unknown): value is TestResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<TestResult>;
  return (
    typeof result.id === "string" &&
    ["distance-acuity", "near-acuity", "contrast", "colour"].includes(result.testType ?? "") &&
    (result.eyeMode === null || ["both", "left", "right"].includes(result.eyeMode ?? "")) &&
    typeof result.score === "number" &&
    Number.isFinite(result.score) &&
    result.score >= 0 &&
    result.score <= 100 &&
    result.scoreVersion === "v1" &&
    !!result.rawMetrics &&
    typeof result.rawMetrics === "object" &&
    typeof result.createdAt === "string" &&
    Number.isFinite(Date.parse(result.createdAt))
  );
}

function isV1(value: unknown): value is VisionKitStorageV1 {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<VisionKitStorageV1>;
  if (
    data.version !== 1 ||
    !data.calibration ||
    !data.preferences ||
    typeof data.preferences.disclaimerAcknowledged !== "boolean" ||
    !Array.isArray(data.results)
  ) {
    return false;
  }

  const { screen, distance } = data.calibration;
  return (
    (screen === null || isScreenCalibration(screen)) &&
    (distance === null || isDistanceCalibration(distance)) &&
    data.results.every(isTestResult)
  );
}

export function loadVisionKitData(storage = browserStorage()): VisionKitStorageV1 {
  if (!storage) return defaultData();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed: unknown = JSON.parse(raw);
    return isV1(parsed) ? parsed : defaultData();
  } catch {
    return defaultData();
  }
}
export function saveVisionKitData(data: VisionKitStorageV1, storage = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function saveScreenCalibration(
  calibration: ScreenCalibration,
  storage = browserStorage(),
): boolean {
  const data = loadVisionKitData(storage);
  return saveVisionKitData(
    { ...data, calibration: { ...data.calibration, screen: calibration } },
    storage,
  );
}

export function saveDistanceCalibration(
  calibration: DistanceCalibration,
  storage = browserStorage(),
): boolean {
  const data = loadVisionKitData(storage);
  return saveVisionKitData(
    { ...data, calibration: { ...data.calibration, distance: calibration } },
    storage,
  );
}

export function appendResult(result: TestResult, storage = browserStorage()): boolean {
  const data = loadVisionKitData(storage);
  const sameTest = data.results.filter((item) => item.testType === result.testType);
  const otherTests = data.results.filter((item) => item.testType !== result.testType);
  const results = [...otherTests, result, ...sameTest].slice(
    0,
    otherTests.length + MAX_RESULTS_PER_TEST,
  );
  return saveVisionKitData({ ...data, results }, storage);
}

export function clearVisionKitData(storage = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
