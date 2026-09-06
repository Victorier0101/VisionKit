import { describe, expect, it } from "vitest";
import { mapArrowKeyToDirection } from "../hooks/useArrowKeys";
import { DIRECTIONS, getNextDirection } from "../lib/tests/random";
describe("direction randomization", () => {
  it("returns only valid directions", () => {
    expect(DIRECTIONS).toContain(getNextDirection([], () => 0.8));
  });
  it("prevents three identical directions in a row", () => {
    expect(getNextDirection(["up", "up"], () => 0)).not.toBe("up");
  });
});

describe("keyboard mapping", () => {
  it("maps all four physical arrow keys", () => {
    expect(mapArrowKeyToDirection("ArrowUp")).toBe("up");
    expect(mapArrowKeyToDirection("ArrowRight")).toBe("right");
    expect(mapArrowKeyToDirection("ArrowDown")).toBe("down");
    expect(mapArrowKeyToDirection("ArrowLeft")).toBe("left");
  });

  it("ignores unsupported keys", () => {
    expect(mapArrowKeyToDirection("KeyW")).toBeNull();
  });
});
