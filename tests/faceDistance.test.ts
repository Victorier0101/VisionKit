import { describe, expect, it } from "vitest";
import {
  calculateFaceScale,
  estimateDistanceCm,
  getPositionStatus,
  median,
  type NormalizedPoint,
} from "../lib/calibration/faceDistance";
import { isBenignMediaPipeConsoleMessage } from "../lib/calibration/faceTracker";

function landmarks(): NormalizedPoint[] {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  points[234] = { x: 0.2, y: 0.5 };
  points[454] = { x: 0.8, y: 0.5 };
  points[127] = { x: 0.25, y: 0.5 };
  points[356] = { x: 0.75, y: 0.5 };
  points[33] = { x: 0.35, y: 0.45 };
  points[263] = { x: 0.65, y: 0.45 };
  return points;
}

describe("face-distance positioning", () => {
  it("calculates the median of odd and even samples", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("uses stable horizontal landmark pairs for normalized face scale", () => {
    expect(calculateFaceScale(landmarks())).toBeCloseTo(0.5);
  });

  it("estimates distance from inverse apparent face size", () => {
    expect(estimateDistanceCm(50, 0.4, 0.2)).toBe(100);
    expect(estimateDistanceCm(50, 0.4, 0.8)).toBe(25);
  });

  it("returns positioning guidance with a ten-percent band", () => {
    expect(getPositionStatus(80, 100)).toBe("move-back");
    expect(getPositionStatus(100, 100)).toBe("good");
    expect(getPositionStatus(120, 100)).toBe("move-closer");
  });

  it("rejects incomplete landmarks and invalid distance inputs", () => {
    expect(() => calculateFaceScale([])).toThrow();
    expect(() => estimateDistanceCm(50, 0.4, 0)).toThrow();
    expect(() => getPositionStatus(100, 0)).toThrow();
  });
});

describe("MediaPipe console filtering", () => {
  it("recognizes only the harmless XNNPACK initialization notice", () => {
    expect(
      isBenignMediaPipeConsoleMessage(["INFO: Created TensorFlow Lite XNNPACK delegate for CPU."]),
    ).toBe(true);
    expect(isBenignMediaPipeConsoleMessage(["Face landmarker failed to initialize"])).toBe(false);
    expect(isBenignMediaPipeConsoleMessage([new Error("A real inference failure")])).toBe(false);
  });
});
