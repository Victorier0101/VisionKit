"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createScreenCalibration,
  getScreenCalibrationStatus,
  ID_CARD_HEIGHT_MM,
  ID_CARD_WIDTH_MM,
  type ScreenEnvironment,
} from "@/lib/calibration/screenCalibration";
import { useVisionKitData } from "@/hooks/useVisionKitData";

export function CardCalibration() {
  const { data, loaded, storeScreenCalibration } = useVisionKitData();
  const [environment, setEnvironment] = useState<ScreenEnvironment | null>(null);
  const [cardWidthPx, setCardWidthPx] = useState(320);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setEnvironment({
      devicePixelRatio: window.devicePixelRatio,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    if (loaded && data.calibration.screen) {
      setCardWidthPx(data.calibration.screen.cardWidthPx);
    }
  }, [data.calibration.screen, loaded]);

  const maximumWidth = useMemo(
    () => Math.max(320, Math.min(1000, (environment?.viewportWidth ?? 1100) - 48)),
    [environment],
  );
  const status = getScreenCalibrationStatus(data.calibration.screen, environment ?? undefined);

  function adjustCardWidth(delta: number) {
    setMessage(null);
    setCardWidthPx((width) => Math.min(maximumWidth, Math.max(100, width + delta)));
  }

  function confirmCalibration() {
    if (!environment) return;
    try {
      const calibration = createScreenCalibration(cardWidthPx, environment);
      if (!storeScreenCalibration(calibration)) {
        setMessage("This browser could not save calibration data. Check your privacy settings.");
        return;
      }
      setMessage("Calibration saved on this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calibration could not be saved.");
    }
  }

  return (
    <main>
      <section className="border-b-2 border-[var(--ink)] bg-[var(--accent)] py-14">
        <div className="container">
          <p className="eyebrow">Phase 3 · Physical screen calibration</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-.055em] md:text-7xl">
            Match a real card to your screen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8">
            Hold a standard credit, debit, or ID card against the display. Adjust the rectangle
            until its width matches the physical card. VisionKit uses only the standard 85.60 mm
            width; no card information is read or saved.
          </p>
        </div>
      </section>

      <section className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="overflow-x-auto rounded-3xl border-2 border-dashed border-[var(--ink)] bg-[var(--surface)] p-8">
            <div
              aria-label="Resizable ID-1 card reference"
              className="relative mx-auto flex items-center justify-center rounded-2xl border-4 border-[var(--ink)] bg-[#e7eadf] shadow-[6px_6px_0_var(--ink)]"
              style={{
                width: cardWidthPx,
                height: cardWidthPx * (ID_CARD_HEIGHT_MM / ID_CARD_WIDTH_MM),
              }}
            >
              <div className="text-center">
                <p className="font-black">ID-1 CARD</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Match the outer width</p>
              </div>
              <span className="absolute bottom-3 right-4 text-xs font-bold">85.60 mm</span>
            </div>
          </div>

          <Card className="p-7">
            <p className="eyebrow text-[var(--success)]">Adjust size</p>
            <p className="mt-4 text-4xl font-black">{Math.round(cardWidthPx)} px</p>
            <label className="mt-7 block font-bold" htmlFor="card-width">
              On-screen card width
            </label>
            <input
              id="card-width"
              className="mt-4 w-full accent-[var(--success)]"
              type="range"
              min="100"
              max={maximumWidth}
              step="1"
              value={Math.min(cardWidthPx, maximumWidth)}
              onChange={(event) => {
                setMessage(null);
                setCardWidthPx(Number(event.target.value));
              }}
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => adjustCardWidth(-4)}>
                − Smaller
              </Button>
              <Button type="button" variant="secondary" onClick={() => adjustCardWidth(4)}>
                + Larger
              </Button>
            </div>
            <Button className="mt-6 w-full" type="button" onClick={confirmCalibration}>
              Widths match — save
            </Button>
            {message && (
              <p className="mt-5 text-sm font-bold" role="status">
                {message}
              </p>
            )}
            {loaded && data.calibration.screen && (
              <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                Saved scale: {data.calibration.screen.pixelsPerMm.toFixed(2)} CSS px/mm ·{" "}
                {status.valid ? "currently valid" : `recalibration needed (${status.reason})`}.
              </p>
            )}
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/tests/distance-acuity">Continue to Distance Acuity</Button>
          <Button href="/" variant="secondary">
            Skip for now
          </Button>
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Skipping is allowed, but VisionKit will not fabricate a size-dependent result. You can
          still use future tests that do not depend on physical stimulus size.
        </p>
      </section>
    </main>
  );
}
