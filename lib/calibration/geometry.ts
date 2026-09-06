const ARC_MINUTES_PER_RADIAN = (180 * 60) / Math.PI;

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
}

export function mmToCssPx(mm: number, pixelsPerMm: number): number {
  assertPositiveFinite(mm, "Millimeters");
  assertPositiveFinite(pixelsPerMm, "Pixels per millimeter");
  return mm * pixelsPerMm;
}

export function cssPxToMm(cssPx: number, pixelsPerMm: number): number {
  assertPositiveFinite(cssPx, "CSS pixels");
  assertPositiveFinite(pixelsPerMm, "Pixels per millimeter");
  return cssPx / pixelsPerMm;
}

export function physicalSizeMmToAngularSizeArcMin(
  physicalSizeMm: number,
  distanceMm: number,
): number {
  assertPositiveFinite(physicalSizeMm, "Physical size");
  assertPositiveFinite(distanceMm, "Viewing distance");
  const radians = 2 * Math.atan(physicalSizeMm / (2 * distanceMm));
  return radians * ARC_MINUTES_PER_RADIAN;
}

export function angularSizeArcMinToPhysicalSizeMm(
  angularSizeArcMin: number,
  distanceMm: number,
): number {
  assertPositiveFinite(angularSizeArcMin, "Angular size");
  assertPositiveFinite(distanceMm, "Viewing distance");
  const radians = angularSizeArcMin / ARC_MINUTES_PER_RADIAN;
  return 2 * distanceMm * Math.tan(radians / 2);
}

export function angularSizeArcMinToCssPx(
  angularSizeArcMin: number,
  distanceCm: number,
  pixelsPerMm: number,
): number {
  assertPositiveFinite(distanceCm, "Viewing distance");
  const physicalSizeMm = angularSizeArcMinToPhysicalSizeMm(angularSizeArcMin, distanceCm * 10);
  return mmToCssPx(physicalSizeMm, pixelsPerMm);
}
