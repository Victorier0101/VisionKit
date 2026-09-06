"use client";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useArrowKeys } from "@/hooks/useArrowKeys";
import { useManagedTimeout } from "@/hooks/useManagedTimeout";
import {
  advanceStaircase,
  calculateThreshold,
  createStaircase,
  type StaircaseConfig,
} from "@/lib/tests/staircase";
import { getNextDirection, type Direction } from "@/lib/tests/random";
import { DirectionalE } from "./DirectionalE";

const config: StaircaseConfig = {
  minLevel: 0,
  maxLevel: 9,
  startLevel: 2,
  minTrials: 12,
  maxTrials: 24,
  targetReversals: 6,
  thresholdReversalCount: 4,
};
type Phase = "intro" | "practice" | "testing" | "result";

export function DirectionalBenchmark() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [state, setState] = useState(() => createStaircase(config));
  const [directions, setDirections] = useState<Direction[]>([]);
  const [direction, setDirection] = useState<Direction>("right");
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const schedule = useManagedTimeout();
  const size = 220 - state.currentLevel * 18;
  const nextDirection = useCallback(() => {
    const next = getNextDirection(directions);
    setDirections((items) => [...items, next]);
    setDirection(next);
  }, [directions]);
  const startPractice = () => {
    setDirection(getNextDirection([]));
    setPhase("practice");
  };
  const startTest = () => {
    setState(createStaircase(config));
    setDirections([]);
    setDirection(getNextDirection([]));
    setFeedback(null);
    setPhase("testing");
  };
  const answer = useCallback(
    (answerDirection: Direction) => {
      if (locked || (phase !== "practice" && phase !== "testing")) return;
      const correct = answerDirection === direction;
      setFeedback(correct ? "correct" : "incorrect");
      setLocked(true);
      if (phase === "practice") {
        schedule(() => {
          setFeedback(null);
          setLocked(false);
          setPhase("testing");
          setState(createStaircase(config));
          setDirections([]);
          setDirection(getNextDirection([]));
        }, 350);
        return;
      }
      const updated = advanceStaircase(state, correct, config);
      setState(updated);
      schedule(() => {
        setFeedback(null);
        setLocked(false);
        if (updated.finished) setPhase("result");
        else nextDirection();
      }, 220);
    },
    [direction, locked, nextDirection, phase, schedule, state],
  );
  useArrowKeys(phase === "practice" || phase === "testing", answer);
  const accuracy = useMemo(
    () =>
      state.history.length
        ? Math.round(
            (state.history.filter((trial) => trial.correct).length / state.history.length) * 100,
          )
        : 0,
    [state.history],
  );
  if (phase === "intro")
    return (
      <section className="container flex min-h-[72vh] items-center py-16">
        <div className="max-w-3xl">
          <p className="eyebrow text-[var(--success)]">Phase 2 playable demo</p>
          <h1 className="mt-4 text-6xl font-black tracking-[-.06em] md:text-8xl">
            Which way is the E facing?
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Use your keyboard arrow keys to match the opening. The challenge adapts after every
            answer. Sizes are temporary and uncalibrated in this phase, so this demo does not
            produce or save a VisionKit score.
          </p>
          <div className="mt-9 flex gap-4">
            <Button onClick={startPractice}>Try a practice round</Button>
            <Button href="/" variant="secondary">
              Back home
            </Button>
          </div>
        </div>
      </section>
    );
  if (phase === "result") {
    const threshold = calculateThreshold(state, config);
    return (
      <section className="container flex min-h-[72vh] items-center justify-center py-16 text-center">
        <div>
          <p className="eyebrow">Demo complete</p>
          <h1 className="mt-3 text-8xl font-black tracking-[-.07em]">{accuracy}%</h1>
          <p className="mt-4 text-lg">
            {state.trialCount} trials · {state.reversals.length} reversals · threshold level{" "}
            {threshold.toFixed(1)}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-[var(--muted)]">
            This is an engine result, not a medical measurement or saved VisionKit score. Calibrated
            scoring arrives in later phases.
          </p>
          <div className="mt-9 flex justify-center gap-4">
            <Button onClick={startTest}>Play again</Button>
            <Button href="/" variant="secondary">
              Dashboard
            </Button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      className={`relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-5 transition-colors ${feedback === "correct" ? "bg-[#c9f5d8]" : feedback === "incorrect" ? "bg-[#ffd7d2]" : "bg-[var(--surface)]"}`}
    >
      <div className="absolute left-5 right-5 top-6 flex items-center justify-between text-sm font-bold">
        <span>
          {phase === "practice"
            ? "Practice"
            : `Trial ${state.trialCount + 1} of ${config.maxTrials}`}
        </span>
        <Button href="/" variant="secondary" className="min-h-10 px-4">
          Exit
        </Button>
      </div>
      <DirectionalE direction={direction} size={phase === "practice" ? 210 : size} />
      <p aria-live="polite" className="mt-12 h-7 text-lg font-black">
        {feedback === "correct"
          ? "Correct"
          : feedback === "incorrect"
            ? `That was ${direction}`
            : "Press the matching arrow key"}
      </p>
      {phase === "practice" && (
        <p className="mt-2 text-sm text-[var(--muted)]">Your test begins after this answer.</p>
      )}
    </section>
  );
}
