import type { CalendarItem } from "./types";

export type Tone = "faceit" | "yellow" | "red" | "neon";

/** The series a calendar row belongs to: its short tag and colour, as on the series cards. */
export function kindOf(tur: string): { tag: string; tone: Tone } {
  if (tur.startsWith("2500 ELO")) return { tag: "2500 ELO YOLU", tone: "faceit" };
  if (tur.startsWith("Haftanın En İyileri")) return { tag: "EN İYİLER", tone: "yellow" };
  if (tur.startsWith("KAELITH İFŞA")) return { tag: "İFŞA", tone: "red" };
  return { tag: tur.toLocaleUpperCase("tr-TR"), tone: "neon" };
}

export interface Slot {
  at: Date;
  kind: string;
  tone: Tone;
  /** The first slot still to come: "SIRADAKİ". */
  next: boolean;
}

export interface Day {
  /** Local midnight of the day (Europe/Istanbul for the viewers). */
  date: Date;
  slots: Slot[];
}

export interface Latest {
  at: Date;
  tag: string;
  tone: Tone;
  title: string;
  url: string;
}

const TZ = "Europe/Istanbul";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // 2026-10-14

/**
 * Splits the calendar for "Bu hafta": the last `latestCount` that came out
 * (newest first) and the next `dayCount` days still to come.
 */
export function splitWeek(items: CalendarItem[], now: Date, { latestCount = 3, dayCount = 4 } = {}): { latest: Latest[]; days: Day[] } {
  const sorted = [...items].sort((a, b) => a.zaman.localeCompare(b.zaman));
  const latest = sorted
    .filter((it) => it.url)
    .slice(-latestCount)
    .reverse()
    .map((it) => ({ at: new Date(it.zaman), ...kindOf(it.tur), title: it.baslik || it.tur, url: it.url! }));

  const days = new Map<string, Day>();
  let first = true;
  for (const it of sorted) {
    const at = new Date(it.zaman);
    if (it.url || at <= now) continue;
    const key = dayKey(at);
    if (!days.has(key)) {
      if (days.size === dayCount) break;
      days.set(key, { date: new Date(`${key}T00:00:00+03:00`), slots: [] });
    }
    const { tone } = kindOf(it.tur);
    days.get(key)!.slots.push({ at, kind: it.tur, tone, next: first });
    first = false;
  }
  return { latest, days: [...days.values()] };
}

/** "Bugün" / "Yarın" / weekday, as seen on `now`. */
export function dayName(date: Date, now: Date): string {
  const k = dayKey(date);
  if (k === dayKey(now)) return "Bugün";
  if (k === dayKey(new Date(now.getTime() + 86400e3))) return "Yarın";
  return date.toLocaleDateString("tr-TR", { weekday: "long", timeZone: TZ });
}

export const clock = (d: Date) => d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const shortDate = (d: Date) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: TZ });
export const weekday = (d: Date, style: "long" | "short" = "long") => d.toLocaleDateString("tr-TR", { weekday: style, timeZone: TZ });
