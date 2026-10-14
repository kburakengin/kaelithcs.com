import type { EloData } from "./types";

/** Everything the ELO road draws, worked out from the match list and nothing else. */
export interface EloRoad {
  now: number;
  first: number;
  from: number;
  to: number;
  left: number;
  /** 0–100, where `now` sits between `from` and `to`. */
  percent: number;
  /** Change over the matches shown. */
  delta: number;
  peak: number;
  count: number;
  /** Chart, in percent of its box: x left to right, y top to bottom. */
  points: { x: number; y: number; elo: number }[];
  ticks: { y: number; elo: number }[];
}

/** Null when there is not enough to draw a line (fewer than two readings). */
export function eloRoad(e: EloData, { maxPoints = 12 } = {}): EloRoad | null {
  const elos = e.maclar.map((p) => p.elo).slice(-maxPoints);
  if (e.simdi != null && elos.at(-1) !== e.simdi) elos.push(e.simdi);
  if (elos.length < 2) return null;
  const now = elos.at(-1)!;
  const lowest = Math.min(...elos);
  const highest = Math.max(...elos);
  // Gridlines every 50 (25 for a narrow range), the line clear of the edges.
  const step = highest - lowest > 60 ? 50 : 25;
  const lo = Math.floor((lowest - 15) / step) * step;
  const hi = Math.ceil((highest + 15) / step) * step;
  const x = (i: number) => 3 + (i * 94) / (elos.length - 1);
  const y = (v: number) => 10 + ((hi - v) * 80) / (hi - lo);
  const ticks = [];
  for (let v = hi - step; v > lo; v -= step) ticks.push({ y: y(v), elo: v });
  return {
    now,
    first: elos[0],
    from: e.baslangic,
    to: e.hedef,
    left: Math.max(0, e.hedef - now),
    percent: Math.max(0, Math.min(100, ((now - e.baslangic) / (e.hedef - e.baslangic)) * 100)),
    delta: now - elos[0],
    peak: highest,
    count: elos.length,
    points: elos.map((elo, i) => ({ x: x(i), y: y(elo), elo })),
    ticks,
  };
}

export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
