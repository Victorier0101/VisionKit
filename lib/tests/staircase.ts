export interface StaircaseConfig {
  minLevel: number;
  maxLevel: number;
  startLevel: number;
  minTrials: number;
  maxTrials: number;
  targetReversals: number;
  thresholdReversalCount: number;
}
export type MovementDirection = "harder" | "easier";
export interface TrialRecord {
  level: number;
  correct: boolean;
  movement: MovementDirection;
  nextLevel: number;
}
export interface StaircaseState {
  currentLevel: number;
  trialCount: number;
  reversals: number[];
  lastDirection: MovementDirection | null;
  history: TrialRecord[];
  finished: boolean;
}

export function validateConfig(config: StaircaseConfig): void {
  if (
    !Number.isInteger(config.minLevel) ||
    !Number.isInteger(config.maxLevel) ||
    config.minLevel > config.maxLevel
  )
    throw new Error("Invalid level range");
  if (config.startLevel < config.minLevel || config.startLevel > config.maxLevel)
    throw new Error("Start level must be within range");
  if (config.minTrials < 1 || config.maxTrials < config.minTrials)
    throw new Error("Invalid trial range");
  if (config.targetReversals < 1 || config.thresholdReversalCount < 1)
    throw new Error("Reversal counts must be positive");
}
export function createStaircase(config: StaircaseConfig): StaircaseState {
  validateConfig(config);
  return {
    currentLevel: config.startLevel,
    trialCount: 0,
    reversals: [],
    lastDirection: null,
    history: [],
    finished: false,
  };
}
export function advanceStaircase(
  state: StaircaseState,
  correct: boolean,
  config: StaircaseConfig,
): StaircaseState {
  validateConfig(config);
  if (state.finished) return state;
  const movement: MovementDirection = correct ? "harder" : "easier";
  const delta = correct ? 1 : -1;
  const nextLevel = Math.min(
    config.maxLevel,
    Math.max(config.minLevel, state.currentLevel + delta),
  );
  const moved = nextLevel !== state.currentLevel;
  const reversed = moved && state.lastDirection !== null && state.lastDirection !== movement;
  const reversals = reversed ? [...state.reversals, state.currentLevel] : [...state.reversals];
  const trialCount = state.trialCount + 1;
  const finished =
    trialCount >= config.maxTrials ||
    (trialCount >= config.minTrials && reversals.length >= config.targetReversals);
  return {
    currentLevel: nextLevel,
    trialCount,
    reversals,
    lastDirection: moved ? movement : state.lastDirection,
    history: [...state.history, { level: state.currentLevel, correct, movement, nextLevel }],
    finished,
  };
}
export function calculateThreshold(state: StaircaseState, config: StaircaseConfig): number {
  const points = state.reversals.slice(-config.thresholdReversalCount);
  if (points.length) return points.reduce((sum, level) => sum + level, 0) / points.length;
  if (state.history.length)
    return state.history.reduce((sum, trial) => sum + trial.level, 0) / state.history.length;
  return state.currentLevel;
}
