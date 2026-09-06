import { describe, expect, it } from "vitest";
import {
  angularSizeArcMinToCssPx,
  angularSizeArcMinToPhysicalSizeMm,
  cssPxToMm,
  mmToCssPx,
  physicalSizeMmToAngularSizeArcMin,
} from "../lib/calibration/geometry";

describe("calibrated geometry", () => {
  it("converts millimeters and CSS pixels in both directions", () => {
    expect(mmToCssPx(85.6, 4)).toBeCloseTo(342.4);
    expect(cssPxToMm(342.4, 4)).toBeCloseTo(85.6);
  });

  it("round-trips physical and angular size", () => {
    const angularSize = physicalSizeMmToAngularSizeArcMin(5, 2000);
    expect(angularSizeArcMinToPhysicalSizeMm(angularSize, 2000)).toBeCloseTo(5, 8);
  });

  it("converts angular size to a finite rendered CSS size", () => {
    expect(angularSizeArcMinToCssPx(5, 200, 4)).toBeCloseTo(11.6355, 3);
  });

  it("rejects invalid inputs", () => {
    expect(() => mmToCssPx(0, 4)).toThrow();
    expect(() => cssPxToMm(100, Number.NaN)).toThrow();
    expect(() => angularSizeArcMinToPhysicalSizeMm(-1, 2000)).toThrow();
  });
});
