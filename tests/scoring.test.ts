import { describe, expect, it } from "vitest";
import { scoreFromLevel } from "../lib/scoring/scoreAcuity";

describe("acuity score v1", () => {
  it("maps the configured minimum and maximum to 0 and 100", () => {
    expect(scoreFromLevel(0, 0, 12)).toBe(0);
    expect(scoreFromLevel(12, 0, 12)).toBe(100);
  });

  it("is monotonic across increasing threshold levels", () => {
    const scores = [0, 2, 4, 6, 8, 10, 12].map((level) => scoreFromLevel(level, 0, 12));
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
  });

  it("clamps scores outside the configured level range", () => {
    expect(scoreFromLevel(-5, 0, 12)).toBe(0);
    expect(scoreFromLevel(20, 0, 12)).toBe(100);
  });
});
