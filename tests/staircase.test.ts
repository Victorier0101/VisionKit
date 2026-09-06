import { describe, expect, it } from "vitest";
import {
  advanceStaircase,
  calculateThreshold,
  createStaircase,
  type StaircaseConfig,
} from "../lib/tests/staircase";
const config: StaircaseConfig = {
  minLevel: 0,
  maxLevel: 5,
  startLevel: 2,
  minTrials: 4,
  maxTrials: 10,
  targetReversals: 2,
  thresholdReversalCount: 2,
};
describe("staircase engine", () => {
  it("moves one level harder after a correct answer", () => {
    expect(advanceStaircase(createStaircase(config), true, config).currentLevel).toBe(3);
  });
  it("moves one level easier after an incorrect answer", () => {
    expect(advanceStaircase(createStaircase(config), false, config).currentLevel).toBe(1);
  });
  it("clamps movement at both boundaries", () => {
    expect(
      advanceStaircase({ ...createStaircase(config), currentLevel: 5 }, true, config).currentLevel,
    ).toBe(5);
    expect(
      advanceStaircase({ ...createStaircase(config), currentLevel: 0 }, false, config).currentLevel,
    ).toBe(0);
  });
  it("records the level where movement reverses", () => {
    const harder = advanceStaircase(createStaircase(config), true, config);
    const easier = advanceStaircase(harder, false, config);
    expect(easier.reversals).toEqual([3]);
  });
  it("does not create a false reversal while clamped", () => {
    const top = { ...createStaircase(config), currentLevel: 5, lastDirection: "easier" as const };
    expect(advanceStaircase(top, true, config).reversals).toEqual([]);
  });
  it("finishes only after minimum trials and target reversals", () => {
    let state = createStaircase(config);
    for (const correct of [true, false, true, false])
      state = advanceStaircase(state, correct, config);
    expect(state.finished).toBe(true);
    expect(state.trialCount).toBe(4);
  });
  it("stops at the hard maximum even without reversals", () => {
    let state = createStaircase(config);
    for (let i = 0; i < 10; i++) state = advanceStaircase(state, true, config);
    expect(state.finished).toBe(true);
    expect(state.trialCount).toBe(10);
  });
  it("averages the configured number of latest reversal levels", () => {
    const state = { ...createStaircase(config), reversals: [1, 3, 5] };
    expect(calculateThreshold(state, config)).toBe(4);
  });
});
