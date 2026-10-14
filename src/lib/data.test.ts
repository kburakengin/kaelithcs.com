import { describe, expect, it } from "vitest";
import { parseSite } from "./data";

describe("parseSite", () => {
  it("drops bad rows and fills the ELO defaults", () => {
    const s = parseSite({
      takvim: [{ zaman: "2026-10-14T09:00:00.000Z", tur: "Short", short: true }, { tur: "zamansız" }, null],
      elo: { simdi: "x", maclar: [{ zaman: "2026-10-05T22:39:26Z", elo: 2035 }, { elo: "?" }] },
    });
    expect(s.takvim).toHaveLength(1);
    expect(s.elo).toEqual({ simdi: null, baslangic: 2000, hedef: 2500, maclar: [{ zaman: "2026-10-05T22:39:26Z", elo: 2035 }] });
    expect(s.kanal).toBeUndefined();
  });

  it("survives an empty file", () => {
    expect(parseSite(null).takvim).toEqual([]);
  });
});
