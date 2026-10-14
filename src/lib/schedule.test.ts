import { describe, expect, it } from "vitest";
import { dayName, kindOf, splitWeek } from "./schedule";
import type { CalendarItem } from "./types";

// Wed 14 Oct 2026, 04:00 in Istanbul (UTC+3)
const now = new Date("2026-10-14T01:00:00Z");
const at = (iso: string, tur: string, extra: Partial<CalendarItem> = {}): CalendarItem => ({ zaman: iso, tur, short: tur === "Short", ...extra });

describe("kindOf", () => {
  it("gives each series its tag and colour", () => {
    expect(kindOf("2500 ELO Yolu #9")).toEqual({ tag: "2500 ELO YOLU", tone: "faceit" });
    expect(kindOf("Haftanın En İyileri")).toEqual({ tag: "EN İYİLER", tone: "yellow" });
    expect(kindOf("KAELITH İFŞA #2")).toEqual({ tag: "İFŞA", tone: "red" });
    expect(kindOf("Short")).toEqual({ tag: "SHORT", tone: "neon" });
  });
});

describe("splitWeek", () => {
  const items = [
    at("2026-10-12T15:00:00Z", "Short", { baslik: "eski", url: "https://youtu.be/a" }),
    at("2026-10-13T09:30:00Z", "Short", { baslik: "dün öğle", url: "https://youtu.be/b" }),
    at("2026-10-13T15:00:00Z", "Short", { baslik: "dün akşam", url: "https://youtu.be/c" }),
    at("2026-10-12T09:00:00Z", "2500 ELO Yolu #9", { baslik: "maç", url: "https://youtu.be/d" }),
    at("2026-10-14T09:00:00Z", "2500 ELO Yolu"),
    at("2026-10-14T09:30:00Z", "Short"),
    at("2026-10-15T09:30:00Z", "Short"),
    at("2026-10-16T09:30:00Z", "Short"),
    at("2026-10-17T09:30:00Z", "Short"),
    at("2026-10-18T09:30:00Z", "Short"),
  ];

  it("lists the last three out, newest first", () => {
    const { latest } = splitWeek(items, now);
    expect(latest.map((l) => l.title)).toEqual(["dün akşam", "dün öğle", "eski"]);
  });

  it("groups what is coming into four days, the first one marked next", () => {
    const { days } = splitWeek(items, now);
    expect(days).toHaveLength(4);
    expect(days[0].slots.map((s) => [s.kind, s.next])).toEqual([
      ["2500 ELO Yolu", true],
      ["Short", false],
    ]);
    expect(days.flatMap((d) => d.slots).filter((s) => s.next)).toHaveLength(1);
  });

  it("drops a row whose time has passed but which never came out", () => {
    const { latest, days } = splitWeek([at("2026-10-13T20:00:00Z", "Short")], now);
    expect(latest).toEqual([]);
    expect(days).toEqual([]);
  });
});

describe("dayName", () => {
  it("names today and tomorrow in Istanbul time", () => {
    expect(dayName(new Date("2026-10-14T00:00:00+03:00"), now)).toBe("Bugün");
    expect(dayName(new Date("2026-10-15T00:00:00+03:00"), now)).toBe("Yarın");
    expect(dayName(new Date("2026-10-16T00:00:00+03:00"), now)).toBe("Cuma");
  });
});
