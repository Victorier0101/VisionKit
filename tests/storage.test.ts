import { beforeEach, describe, expect, it } from "vitest";
import { createScreenCalibration } from "../lib/calibration/screenCalibration";
import { defaultData, STORAGE_KEY } from "../lib/storage/schema";
import {
  appendResult,
  clearVisionKitData,
  loadVisionKitData,
  MAX_RESULTS_PER_TEST,
  saveScreenCalibration,
  saveVisionKitData,
  type StorageLike,
} from "../lib/storage/storage";
import type { TestResult } from "../types/results";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function result(id: string): TestResult {
  return {
    id,
    testType: "distance-acuity",
    eyeMode: "both",
    score: 75,
    scoreVersion: "v1",
    rawMetrics: { thresholdLevel: 9 },
    calibrationSnapshot: null,
    createdAt: "2026-09-01T00:00:00Z",
  };
}

describe("VisionKit storage", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("returns defaults for empty and corrupted storage", () => {
    expect(loadVisionKitData(storage)).toEqual(defaultData());
    storage.setItem(STORAGE_KEY, "not-json");
    expect(loadVisionKitData(storage)).toEqual(defaultData());
  });

  it("loads valid saved data", () => {
    const data = defaultData();
    expect(saveVisionKitData(data, storage)).toBe(true);
    expect(loadVisionKitData(storage)).toEqual(data);
  });

  it("saves screen calibration through the storage service", () => {
    const calibration = createScreenCalibration(
      342.4,
      { devicePixelRatio: 2, viewportWidth: 1440, viewportHeight: 900 },
      "2026-09-01T00:00:00Z",
    );
    expect(saveScreenCalibration(calibration, storage)).toBe(true);
    expect(loadVisionKitData(storage).calibration.screen).toEqual(calibration);
  });

  it("appends results and caps history per test", () => {
    for (let index = 0; index <= MAX_RESULTS_PER_TEST; index += 1) {
      appendResult(result(String(index)), storage);
    }
    const results = loadVisionKitData(storage).results;
    expect(results).toHaveLength(MAX_RESULTS_PER_TEST);
    expect(results[0].id).toBe(String(MAX_RESULTS_PER_TEST));
  });

  it("clears all local VisionKit data", () => {
    saveVisionKitData(defaultData(), storage);
    expect(clearVisionKitData(storage)).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
