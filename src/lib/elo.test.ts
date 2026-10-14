import { describe, expect, it } from "vitest";
import { eloRoad, signed } from "./elo";

const data = (elos: number[], simdi: number | null = null) => ({
  simdi,
  baslangic: 2000,
  hedef: 2500,
  maclar: elos.map((elo, i) => ({ zaman: `2026-10-0${i + 1}T20:00:00Z`, elo })),
});

describe("eloRoad", () => {
  it("works out the numbers from the matches only", () => {
    const r = eloRoad(data([2035, 2036, 2065, 2125, 2141, 2142, 2139, 2136, 2138, 2135]))!;
    expect([r.now, r.left, r.delta, r.peak, r.count]).toEqual([2135, 365, 100, 2142, 10]);
    expect(r.percent).toBeCloseTo(27);
  });

  it("adds the reading now when it differs from the last match", () => {
    const r = eloRoad(data([2100, 2120], 2131))!;
    expect(r.count).toBe(3);
    expect(r.now).toBe(2131);
  });

  it("keeps the line inside the box, oldest left", () => {
    const r = eloRoad(data([2035, 2142, 2135]))!;
    for (const p of r.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
    expect(r.points[0].x).toBeLessThan(r.points.at(-1)!.x);
    // Higher ELO is higher up
    expect(r.points[1].y).toBeLessThan(r.points[0].y);
  });

  it("draws gridlines every 50 over a wide range, every 25 over a narrow one", () => {
    expect(new Set(eloRoad(data([2035, 2142]))!.ticks.map((t) => t.elo % 50))).toEqual(new Set([0]));
    expect(eloRoad(data([2100, 2120]))!.ticks.some((t) => t.elo % 50 !== 0)).toBe(true);
  });

  it("has nothing to draw with one reading", () => {
    expect(eloRoad(data([2100]))).toBeNull();
    expect(eloRoad(data([], 2100))).toBeNull();
  });

  it("clamps past the goal", () => {
    const r = eloRoad(data([2490, 2510]))!;
    expect(r.percent).toBe(100);
    expect(r.left).toBe(0);
  });
});

describe("signed", () => {
  it("puts a plus on a gain", () => {
    expect([signed(100), signed(-12), signed(0)]).toEqual(["+100", "-12", "0"]);
  });
});
