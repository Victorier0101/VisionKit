import { describe, expect, it } from "vitest";
import {
  calculatePixelsPerMm,
  createScreenCalibration,
  getScreenCalibrationStatus,
  isScreenCalibration,
} from "../lib/calibration/screenCalibration";

const environment = { devicePixelRatio: 2, viewportWidth: 1440, viewportHeight: 900 };

describe("screen calibration", () => {
  it("derives CSS pixels per millimeter from an ID-1 card", () => {
    expect(calculatePixelsPerMm(342.4)).toBeCloseTo(4);
  });

  it("creates and validates a calibration snapshot", () => {
    const calibration = createScreenCalibration(342.4, environment, "2026-09-01T00:00:00Z");
    expect(calibration.pixelsPerMm).toBeCloseTo(4);
    expect(isScreenCalibration(calibration)).toBe(true);
  });

  it("rejects implausible scale values", () => {
    expect(() => createScreenCalibration(20, environment)).toThrow();
    expect(() => createScreenCalibration(2000, environment)).toThrow();
  });

  it("marks old calibration as expired", () => {
    const calibration = createScreenCalibration(342.4, environment, "2026-07-01T00:00:00Z");
    expect(getScreenCalibrationStatus(calibration, environment, new Date("2026-09-01"))).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  it("detects a substantial display-scale change", () => {
    const calibration = createScreenCalibration(342.4, environment, "2026-09-01T00:00:00Z");
    expect(
      getScreenCalibrationStatus(
        calibration,
        { ...environment, devicePixelRatio: 1 },
        new Date("2026-09-02"),
      ),
    ).toEqual({ valid: false, reason: "display-changed" });
  });
});
