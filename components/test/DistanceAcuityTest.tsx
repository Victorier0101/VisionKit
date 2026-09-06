"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useArrowKeys } from "@/hooks/useArrowKeys";
import { useManagedTimeout } from "@/hooks/useManagedTimeout";
import { useVisionKitData } from "@/hooks/useVisionKitData";
import {
  getScreenCalibrationStatus,
  type ScreenEnvironment,
} from "@/lib/calibration/screenCalibration";
import { SCORE_VERSION, scoreFromLevel } from "@/lib/scoring/scoreAcuity";
import {
  DISTANCE_ACUITY_CONFIG,
  getAcuityRenderedSizePx,
  getAngularSizeAtThreshold,
  validateViewingDistance,
} from "@/lib/tests/acuity";
import { getNextDirection } from "@/lib/tests/random";
import {
  advanceStaircase,
  calculateThreshold,
  createStaircase,
  type StaircaseState,
} from "@/lib/tests/staircase";
import { createId } from "@/lib/utils/ids";
import type { DistanceCalibration } from "@/types/calibration";
import type { TestResult } from "@/types/results";
import type { Direction, EyeMode } from "@/types/tests";
import { DirectionalE } from "./DirectionalE";
import { EyeModeSelector } from "./EyeModeSelector";

type Phase =
  "intro" | "eye-mode" | "eye-instructions" | "position" | "practice" | "testing" | "result";

interface CompletedResult {
  result: TestResult;
  previousScore: number | null;
  saved: boolean;
}

const eyeInstructions: Record<EyeMode, string> = {
  both: "Keep both eyes open and look naturally at the screen.",
  left: "Cover or gently close your right eye. Do not press on the eye.",
  right: "Cover or gently close your left eye. Do not press on the eye.",
};

export function DistanceAcuityTest() {
  const { data, loaded, storeDistanceCalibration, storeResult } = useVisionKitData();
  const schedule = useManagedTimeout();
  const [environment, setEnvironment] = useState<ScreenEnvironment | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [eyeMode, setEyeMode] = useState<EyeMode | null>(null);
  const [distanceInput, setDistanceInput] = useState(
    String(DISTANCE_ACUITY_CONFIG.targetDistanceCm),
  );
  const [distanceCm, setDistanceCm] = useState(DISTANCE_ACUITY_CONFIG.targetDistanceCm);
  const [state, setState] = useState<StaircaseState>(() =>
    createStaircase(DISTANCE_ACUITY_CONFIG.staircase),
  );
  const [direction, setDirection] = useState<Direction>("right");
  const [directionHistory, setDirectionHistory] = useState<Direction[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [locked, setLocked] = useState(false);
  const [trialStartedAt, setTrialStartedAt] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [completed, setCompleted] = useState<CompletedResult | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);

  useEffect(() => {
    setEnvironment({
      devicePixelRatio: window.devicePixelRatio,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    const savedDistance = data.calibration.distance?.manualDistanceCm;
    if (loaded && savedDistance) {
      setDistanceInput(String(savedDistance));
      setDistanceCm(savedDistance);
    }
  }, [data.calibration.distance, loaded]);

  const calibrationStatus = getScreenCalibrationStatus(
    data.calibration.screen,
    environment ?? undefined,
  );

  const selectDirection = useCallback(() => {
    setDirectionHistory((history) => {
      const next = getNextDirection(history);
      setDirection(next);
      return [...history, next];
    });
    setTrialStartedAt(performance.now());
  }, []);

  function beginPractice() {
    setFeedback(null);
    setLocked(false);
    setDirectionHistory([]);
    setDirection(getNextDirection([]));
    setTrialStartedAt(performance.now());
    setPhase("practice");
  }

  function beginScoredTest() {
    setState(createStaircase(DISTANCE_ACUITY_CONFIG.staircase));
    setResponseTimes([]);
    setFeedback(null);
    setLocked(false);
    setDirectionHistory([]);
    setDirection(getNextDirection([]));
    setTrialStartedAt(performance.now());
    setPhase("testing");
  }

  function confirmDistance() {
    const parsedDistance = Number(distanceInput);
    if (!validateViewingDistance(parsedDistance, DISTANCE_ACUITY_CONFIG)) {
      setPositionError(
        `Enter a distance from ${DISTANCE_ACUITY_CONFIG.minimumDistanceCm} to ${DISTANCE_ACUITY_CONFIG.maximumDistanceCm} cm.`,
      );
      return;
    }

    const calibration: DistanceCalibration = {
      version: 1,
      mode: "manual",
      manualDistanceCm: parsedDistance,
      calibratedAt: new Date().toISOString(),
    };
    if (!storeDistanceCalibration(calibration)) {
      setPositionError("This browser could not save your distance setting.");
      return;
    }

    setPositionError(null);
    setDistanceCm(parsedDistance);
    beginPractice();
  }

  const finishTest = useCallback(
    (finishedState: StaircaseState, finishedResponseTimes: number[]) => {
      if (!eyeMode || !data.calibration.screen) return;
      const thresholdLevel = calculateThreshold(finishedState, DISTANCE_ACUITY_CONFIG.staircase);
      const score = scoreFromLevel(
        thresholdLevel,
        DISTANCE_ACUITY_CONFIG.staircase.minLevel,
        DISTANCE_ACUITY_CONFIG.staircase.maxLevel,
      );
      const accuracyPercent = Math.round(
        (finishedState.history.filter((trial) => trial.correct).length /
          finishedState.history.length) *
          100,
      );
      const distanceCalibration: DistanceCalibration = {
        version: 1,
        mode: "manual",
        manualDistanceCm: distanceCm,
        calibratedAt: new Date().toISOString(),
      };
      const result: TestResult = {
        id: createId(),
        testType: "distance-acuity",
        eyeMode,
        score,
        scoreVersion: SCORE_VERSION,
        rawMetrics: {
          thresholdLevel,
          thresholdAngularSizeArcMin: getAngularSizeAtThreshold(
            thresholdLevel,
            DISTANCE_ACUITY_CONFIG,
          ),
          trials: finishedState.trialCount,
          reversals: finishedState.reversals.length,
          accuracyPercent,
          meanResponseTimeMs: Math.round(
            finishedResponseTimes.reduce((sum, time) => sum + time, 0) /
              finishedResponseTimes.length,
          ),
          manualViewingDistanceCm: distanceCm,
        },
        calibrationSnapshot: {
          screen: data.calibration.screen,
          distance: distanceCalibration,
        },
        createdAt: new Date().toISOString(),
      };
      const previous = data.results.find(
        (item) => item.testType === "distance-acuity" && item.eyeMode === eyeMode,
      );
      const saved = storeResult(result);
      setCompleted({ result, previousScore: previous?.score ?? null, saved });
      setPhase("result");
    },
    [data.calibration.screen, data.results, distanceCm, eyeMode, storeResult],
  );

  const answer = useCallback(
    (answerDirection: Direction) => {
      if (locked || (phase !== "practice" && phase !== "testing")) return;
      const correct = answerDirection === direction;
      const responseTime = Math.max(0, performance.now() - trialStartedAt);
      setFeedback(correct ? "correct" : "incorrect");
      setLocked(true);

      if (phase === "practice") {
        schedule(beginScoredTest, 400);
        return;
      }

      const updatedState = advanceStaircase(state, correct, DISTANCE_ACUITY_CONFIG.staircase);
      const updatedResponseTimes = [...responseTimes, responseTime];
      setState(updatedState);
      setResponseTimes(updatedResponseTimes);
      schedule(() => {
        setFeedback(null);
        setLocked(false);
        if (updatedState.finished) finishTest(updatedState, updatedResponseTimes);
        else selectDirection();
      }, 240);
    },
    [
      direction,
      finishTest,
      locked,
      phase,
      responseTimes,
      schedule,
      selectDirection,
      state,
      trialStartedAt,
    ],
  );

  useArrowKeys(phase === "practice" || phase === "testing", answer);

  const renderedSizePx = useMemo(() => {
    if (!data.calibration.screen || phase !== "testing") return 190;
    return getAcuityRenderedSizePx(
      state.currentLevel,
      distanceCm,
      data.calibration.screen.pixelsPerMm,
      DISTANCE_ACUITY_CONFIG,
    );
  }, [data.calibration.screen, distanceCm, phase, state.currentLevel]);

  if (!loaded || !environment) {
    return (
      <main className="container flex min-h-[68vh] items-center">
        <p className="text-lg font-bold">Loading your local calibration…</p>
      </main>
    );
  }

  if (phase === "intro") {
    return (
      <main className="container flex min-h-[72vh] items-center py-16">
        <div className="max-w-3xl">
          <p className="eyebrow text-[var(--success)]">Phase 4 · Distance Acuity</p>
          <h1 className="mt-4 text-6xl font-black tracking-[-.06em] md:text-8xl">
            Find your smallest clear E.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            VisionKit will render calibrated directional E shapes and adapt their angular size from
            your answers. This produces a VisionKit browser-test score—not a diagnosis,
            prescription, or clinical acuity measurement.
          </p>
          {!calibrationStatus.valid ? (
            <Card className="mt-8 p-6">
              <p className="font-black">Screen calibration required</p>
              <p className="mt-2 leading-6 text-[var(--muted)]">
                {calibrationStatus.reason === "expired"
                  ? "Your saved calibration is over 30 days old."
                  : calibrationStatus.reason === "display-changed"
                    ? "The display scale changed since calibration."
                    : "VisionKit does not have a valid physical screen scale yet."}
              </p>
              <Button className="mt-5" href="/calibration">
                Calibrate screen
              </Button>
            </Card>
          ) : (
            <div className="mt-9 flex flex-wrap gap-4">
              <Button onClick={() => setPhase("eye-mode")}>Begin test</Button>
              <Button href="/calibration" variant="secondary">
                Recalibrate
              </Button>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (phase === "eye-mode") {
    return (
      <main className="container min-h-[72vh] py-16">
        <p className="eyebrow">Step 1 of 3</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-.05em]">Choose an eye mode.</h1>
        <EyeModeSelector
          onSelect={(mode) => {
            setEyeMode(mode);
            setPhase("eye-instructions");
          }}
        />
      </main>
    );
  }

  if (phase === "eye-instructions" && eyeMode) {
    return (
      <main className="container flex min-h-[72vh] items-center py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Step 2 of 3 · {eyeMode.replace("both", "both eyes")}</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-.05em]">Settle into position.</h1>
          <p className="mt-6 text-xl leading-8">{eyeInstructions[eyeMode]}</p>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Keep the same eye arrangement and viewing position for the full test. The current phase
            does not use the camera to verify this.
          </p>
          <div className="mt-8 flex gap-4">
            <Button onClick={() => setPhase("position")}>I’m ready</Button>
            <Button variant="secondary" onClick={() => setPhase("eye-mode")}>
              Change mode
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "position") {
    return (
      <main className="container flex min-h-[72vh] items-center py-16">
        <Card className="w-full max-w-2xl p-8 md:p-10">
          <p className="eyebrow">Step 3 of 3 · Manual viewing distance</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.045em]">
            Measure from your eyes to the screen.
          </h1>
          <p className="mt-5 leading-7 text-[var(--muted)]">
            Use a tape measure or a reasonable measured estimate, then remain at that distance. The
            recommended starting position is 200 cm.
          </p>
          <label className="mt-7 block font-bold" htmlFor="viewing-distance">
            Viewing distance in centimeters
          </label>
          <input
            id="viewing-distance"
            className="mt-3 w-full rounded-2xl border-2 border-[var(--ink)] bg-white px-5 py-4 text-xl font-black"
            type="number"
            inputMode="numeric"
            min={DISTANCE_ACUITY_CONFIG.minimumDistanceCm}
            max={DISTANCE_ACUITY_CONFIG.maximumDistanceCm}
            value={distanceInput}
            onChange={(event) => setDistanceInput(event.target.value)}
          />
          {positionError && (
            <p className="mt-3 font-bold text-[var(--danger)]" role="alert">
              {positionError}
            </p>
          )}
          <div className="mt-7 flex flex-wrap gap-4">
            <Button onClick={confirmDistance}>Save distance and practice</Button>
            <Button variant="secondary" onClick={() => setPhase("eye-instructions")}>
              Back
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  if (phase === "result" && completed) {
    const { result, previousScore, saved } = completed;
    const scoreDelta = previousScore === null ? null : result.score - previousScore;
    return (
      <main className="container flex min-h-[74vh] items-center justify-center py-16 text-center">
        <div>
          <p className="eyebrow text-[var(--success)]">Distance Acuity · {result.eyeMode}</p>
          <p className="mt-5 text-[9rem] font-black leading-none tracking-[-.09em]">
            {result.score}
          </p>
          <h1 className="mt-2 text-3xl font-black">VisionKit score</h1>
          <p className="mx-auto mt-6 max-w-2xl leading-7 text-[var(--muted)]">
            Threshold level {Number(result.rawMetrics.thresholdLevel).toFixed(1)} ·{" "}
            {result.rawMetrics.accuracyPercent}% accuracy · {result.rawMetrics.trials} trials
          </p>
          <p className="mt-3 font-bold">
            {scoreDelta === null
              ? "This is your first result for this eye mode."
              : scoreDelta === 0
                ? "Same score as your previous attempt."
                : `${scoreDelta > 0 ? "+" : ""}${scoreDelta} from your previous attempt.`}
          </p>
          {!saved && (
            <p className="mt-3 font-bold text-[var(--danger)]">
              The result could not be saved in this browser.
            </p>
          )}
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[var(--muted)]">
            This score reflects performance in this browser setup. It is not a medical exam,
            diagnosis, prescription, or statement about eye health.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Button onClick={() => setPhase("eye-mode")}>Test again</Button>
            <Button href="/" variant="secondary">
              Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-5 transition-colors ${feedback === "correct" ? "bg-[#c9f5d8]" : feedback === "incorrect" ? "bg-[#ffd7d2]" : "bg-[var(--surface)]"}`}
    >
      <div className="absolute left-5 right-5 top-6 flex items-center justify-between text-sm font-bold">
        <span>
          {phase === "practice"
            ? "Practice"
            : `Trial ${state.trialCount + 1} of ${DISTANCE_ACUITY_CONFIG.staircase.maxTrials}`}
        </span>
        <Button href="/" variant="secondary" className="min-h-10 px-4">
          Exit
        </Button>
      </div>
      <DirectionalE direction={direction} size={renderedSizePx} />
      <p aria-live="polite" className="mt-12 h-7 text-lg font-black">
        {feedback === "correct"
          ? "Correct"
          : feedback === "incorrect"
            ? `That was ${direction}`
            : "Press the matching arrow key"}
      </p>
      {phase === "practice" && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Practice uses a large example. The calibrated test begins after this answer.
        </p>
      )}
    </main>
  );
}
