import type { ScreenCalibration } from "../../types/calibration";

export const ID_CARD_WIDTH_MM = 85.6 as const;
export const ID_CARD_HEIGHT_MM = 53.98;
export const CALIBRATION_MAX_AGE_DAYS = 30;
export const MIN_PIXELS_PER_MM = 1;
export const MAX_PIXELS_PER_MM = 20;

export interface ScreenEnvironment {
  devicePixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
}

export type CalibrationStatus =
  | { valid: true; reason: null }
  | { valid: false; reason: "missing" | "invalid" | "expired" | "display-changed" };

export function calculatePixelsPerMm(cardWidthPx: number): number {
  if (!Number.isFinite(cardWidthPx) || cardWidthPx <= 0) {
    throw new Error("Card width must be a positive finite number");
  }

  return cardWidthPx / ID_CARD_WIDTH_MM;
}

export function isValidPixelsPerMm(pixelsPerMm: number): boolean {
  return (
    Number.isFinite(pixelsPerMm) &&
    pixelsPerMm >= MIN_PIXELS_PER_MM &&
    pixelsPerMm <= MAX_PIXELS_PER_MM
  );
}

export function createScreenCalibration(
  cardWidthPx: number,
  environment: ScreenEnvironment,
  calibratedAt = new Date().toISOString(),
): ScreenCalibration {
  const pixelsPerMm = calculatePixelsPerMm(cardWidthPx);
  if (!isValidPixelsPerMm(pixelsPerMm)) {
    throw new Error("The matched card width is outside VisionKit's calibration guardrails");
  }

  if (
    !Number.isFinite(environment.devicePixelRatio) ||
    environment.devicePixelRatio <= 0 ||
    !Number.isFinite(environment.viewportWidth) ||
    environment.viewportWidth <= 0 ||
    !Number.isFinite(environment.viewportHeight) ||
    environment.viewportHeight <= 0 ||
    !Number.isFinite(Date.parse(calibratedAt))
  ) {
    throw new Error("Calibration environment is invalid");
  }

  return {
    version: 1,
    pixelsPerMm,
    cardWidthPx,
    referenceWidthMm: ID_CARD_WIDTH_MM,
    devicePixelRatio: environment.devicePixelRatio,
    viewportWidth: environment.viewportWidth,
    viewportHeight: environment.viewportHeight,
    calibratedAt,
  };
}

export function isScreenCalibration(value: unknown): value is ScreenCalibration {
  if (!value || typeof value !== "object") return false;
  const calibration = value as Partial<ScreenCalibration>;
  return (
    calibration.version === 1 &&
    calibration.referenceWidthMm === ID_CARD_WIDTH_MM &&
    typeof calibration.cardWidthPx === "number" &&
    typeof calibration.pixelsPerMm === "number" &&
    isValidPixelsPerMm(calibration.pixelsPerMm) &&
    Math.abs(calculatePixelsPerMm(calibration.cardWidthPx) - calibration.pixelsPerMm) < 0.001 &&
    typeof calibration.devicePixelRatio === "number" &&
    calibration.devicePixelRatio > 0 &&
    typeof calibration.viewportWidth === "number" &&
    calibration.viewportWidth > 0 &&
    typeof calibration.viewportHeight === "number" &&
    calibration.viewportHeight > 0 &&
    typeof calibration.calibratedAt === "string" &&
    Number.isFinite(Date.parse(calibration.calibratedAt))
  );
}

export function getScreenCalibrationStatus(
  calibration: ScreenCalibration | null,
  environment?: ScreenEnvironment,
  now = new Date(),
): CalibrationStatus {
  if (!calibration) return { valid: false, reason: "missing" };
  if (!isScreenCalibration(calibration)) return { valid: false, reason: "invalid" };

  const ageMs = now.getTime() - Date.parse(calibration.calibratedAt);
  if (ageMs < 0 || ageMs > CALIBRATION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
    return { valid: false, reason: "expired" };
  }

  if (environment && Math.abs(environment.devicePixelRatio - calibration.devicePixelRatio) > 0.1) {
    return { valid: false, reason: "display-changed" };
  }

  return { valid: true, reason: null };
}
